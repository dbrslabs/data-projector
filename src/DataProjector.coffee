# DataProjector.coffee
# Tomasz (Tomek) Zemla
# tomek@datacratic.com

# Main class of the data visualization application.

Subject = require('./Subject.coffee')
Observer = require('./Observer.coffee')
Utility = require('./Utility.coffee')
Palette = require('./Palette.coffee')
Storage = require('./Storage.coffee')
Toolbar = require('./Toolbar.coffee')
Menu = require('./Menu.coffee')
Info = require('./Info.coffee')
Projector = require('./Projector.coffee')

class DataProjector extends Observer

   # M E M B E R S

   # main modules

   storage : null # read/write

   toolbar : null # main application menu
   menu : null # main data menu - left side panel
   info : null # information console - right side panel

   projector : null # WebGL visualization canvas

   palette : null # stores both fixed UI colors and autogenerated ones for visualization
   colors : null # Array<THREE.Color> generated color values for visualization

   # C O N S T R U C T O R

   # Create data projector and display/visualize given data file.
   constructor : ->

      # data read/write access

      @storage = new Storage()
      @storage.attach(@)
      @storage.requestData()

      # user interface - panels

      @toolbar = new Toolbar('#toolbar')
      @toolbar.attach(@)

      @menu = new Menu('#menu')
      @menu.attach(@)

      @info = new Info('#info')
      @info.attach(@)

      # user interface - visualization

      @projector = new Projector()
      @projector.attach(@)

      # throw new Error()


   # E V E N T   H A N D L E R S

   # Derived from Observer, update is fired whenever event notifications from subjects come in.
   update: (subject, type, data) ->

      if subject instanceof Storage then @onStorageEvent(type, data)
      if subject instanceof Toolbar then @onToolbarEvent(type, data)
      if subject instanceof Menu then @onMenuEvent(type, data)
      if subject instanceof Projector then @onProjectorEvent(type, data)


   # Handle storage events.
   onStorageEvent : (type, data) ->

      switch type

         when Storage.EVENT_DATA_READY
            @info.display "Processed #{@storage.getPoints()} points."
            @info.display "Found #{@storage.getClusters()} clusters."
            @initialize() # get going!

         when Storage.EVENT_SCREENSHOT_OK
            @info.display "Screenshot #{@storage.getSaved()} saved."


   # Handle toolbar events.
   onToolbarEvent : (type, data) ->

      switch type

         when Toolbar.EVENT_MENU
            state = @menu.toggle()
            @toolbar.setMenuButtonSelected(state)

         when Toolbar.EVENT_INFO
            state = @info.toggle()
            @toolbar.setInfoButtonSelected(state)

         when Toolbar.EVENT_PERSPECTIVE
            @projector.setMode(Projector.VIEW.PERSPECTIVE)
            @toolbar.setCameraButtonSelected(true, false, false)

         when Toolbar.EVENT_ORTHOGRAPHIC
            @projector.setMode(Projector.VIEW.ORTHOGRAPHIC)
            @toolbar.setCameraButtonSelected(false, true, false)

         when Toolbar.EVENT_DUAL
            @projector.setMode(Projector.VIEW.DUAL)
            @toolbar.setCameraButtonSelected(false, false, true)

         when Toolbar.EVENT_RESET
            @projector.resetCamera(true)
            @toolbar.blinkResetButton()
            
         when Toolbar.EVENT_CLEAR
            @info.clear()
            @toolbar.blinkClearButton()

         when Toolbar.EVENT_BOX
            state = @projector.toggleBox()
            @toolbar.setBoxButtonSelected(state)

         when Toolbar.EVENT_VIEWPORT
            state = @projector.toggleViewport()
            @toolbar.setViewportButtonSelected(state)

         when Toolbar.EVENT_SELECT
            state = @projector.toggleSelector()
            @toolbar.setSelectButtonSelected(state)

         when Toolbar.EVENT_VIEW_TOP
            @projector.changeView(Utility.DIRECTION.TOP)
            @toolbar.setViewButtonSelected(true, false, false)

         when Toolbar.EVENT_VIEW_FRONT
            @projector.changeView(Utility.DIRECTION.FRONT)
            @toolbar.setViewButtonSelected(false, true, false)

         when Toolbar.EVENT_VIEW_SIDE
            @projector.changeView(Utility.DIRECTION.SIDE)
            @toolbar.setViewButtonSelected(false, false, true)

         when Toolbar.EVENT_SPIN_LEFT
            @projector.setSpin(Projector.SPIN.LEFT)
            @toolbar.setSpinButtonSelected(true, false, false)

         when Toolbar.EVENT_SPIN_STOP
            @projector.setSpin(Projector.SPIN.NONE)
            @toolbar.setSpinButtonSelected(false, true, false)

         when Toolbar.EVENT_SPIN_RIGHT
            @projector.setSpin(Projector.SPIN.RIGHT)
            @toolbar.setSpinButtonSelected(false, false, true)

         when Toolbar.EVENT_ANIMATE
            state = @projector.toggleAnimation()
            @toolbar.setAnimateButtonSelected(state)

         when Toolbar.EVENT_PRINT
            @storage.saveImage(@projector.getImage())
            @toolbar.blinkPrintButton()


   # Handle menu events.
   onMenuEvent : (type, data) ->

      switch type

         when Menu.EVENT_TOGGLE_ALL_ON
            @projector.setAllClustersVisible(true)

         when Menu.EVENT_TOGGLE_ALL_OFF
            @projector.setAllClustersVisible(false)

         when Menu.EVENT_TOGGLE_ID
            @projector.toggleClusterVisibility(data.id)

         when Menu.EVENT_CLUSTER_ID
            @projector.toggleClusterSelection(data.id)


   # Handle projector events.
   onProjectorEvent : (type, data) ->

      console.log "DataProjector.onProjectorEvent " + type + " : " + data

      switch type

         when Projector.EVENT_DATA_LOADED
            console.log "DataProjector.onProjectorEvent " + type
         
         when Projector.EVENT_POINTS_SELECTED
             @info.displayDocuments data,

         when Projector.EVENT_CLUSTER_SELECTED
            if data.id > -1
               @info.display("Cluster #{data.id} selected")
            else 
               @info.display("No cluster selected")



   # M E T H O D S   


   # Initialize the application with the loaded data.
   initialize : ->

      # autogenerate palette for the visualization and menus   

      @palette = new Palette(@storage.getClusters())
      @colors = @palette.getColors()

      # dynamically build menu for all clusters

      @menu.create(@storage.getClusters(), @palette.getColors())

      @projector.setColors(@colors) # use generated palette
      @projector.load(@storage) # load data for visualization
      @onToolbarEvent(Toolbar.EVENT_SPIN_RIGHT)


dataProjector = new DataProjector() # run!
