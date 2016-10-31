# Menu.coffee
# Tomasz (Tomek) Zemla
# tomek@datacratic.com

# Main application menu on the left side of the application window.

Panel = require('./Panel.coffee')

class Menu extends Panel

   # E V E N T S

   @EVENT_TOGGLE_ALL_ON : "EVENT_TOGGLE_ALL_ON"
   @EVENT_TOGGLE_ALL_OFF : "EVENT_TOGGLE_ALL_OFF"

   @EVENT_TOGGLE_ID : "EVENT_TOGGLE_ID"
   @EVENT_CLUSTER_ID : "EVENT_CLUSTER_ID"

   # C O N S T A N T S

   @TOGGLE_ON :  true
   @TOGGLE_OFF : false
   @TOGGLE_MIX : false

   # M E M B E R S

   clusters : 0 # total number of clusters

   selected : -1 # currently selected cluster

   colors : null # set of colors to use

   allId : '#toggleAll'


   # C O N S T R U C T O R

   constructor : (id) ->

      super(id)


   # E V E N T   H A N D L E R S

   # Toggle visibility of all clusters at once.
   onToggleAll : (event) =>

      state = @getState @allId

      switch state

         when Menu.TOGGLE_OFF, Menu.TOGGLE_MIX # turn all on

            @setState @allId, Menu.TOGGLE_ON

            for i in [0...@clusters]
               tag = '#c' + String(i)
               @setState tag, Menu.TOGGLE_ON

            @notify(Menu.EVENT_TOGGLE_ALL_ON)

         when Menu.TOGGLE_ON # turn all off

            @setState @allId, Menu.TOGGLE_OFF

            for i in [0...@clusters]
               tag = '#c' + String(i)
               @setState tag, Menu.TOGGLE_OFF

            @notify(Menu.EVENT_TOGGLE_ALL_OFF)


   onToggle : (event) =>

      identifier = event.target.id
      id = identifier.replace("c", "")
      index = parseInt(id)

      @doToggle(index)
      @notify(Menu.EVENT_TOGGLE_ID, { id : index })


   onCluster : (event) =>

      # retrieve clicked cluster number
      index = parseInt(event.target.id.replace("b", ""))

      if @selected is index then @selected = -1 # unselect
      else @selected = index # select

      @updateSwatches()
      @updateButtons()

      @notify(Menu.EVENT_CLUSTER_ID, { id : index })


   # Flip toggle given by its index.
   doToggle : (index) ->

      tag = "#c" + String(index)
      state = @getState tag

      switch state

         when Menu.TOGGLE_OFF
            @setState tag, Menu.TOGGLE_ON

         when Menu.TOGGLE_ON
            @setState tag, Menu.TOGGLE_OFF

      @updateMasterToggle()


   # M E T H O D S

   # Create dynamically menu for given number of clusters.
   # Use given set of colors for color coding to match visualization.
   create : (@clusters, @colors) ->

      # button IDs are b0, b1, b2...
      # toggle IDs are t0, t1, t2...
      # swatch IDs are c0, c1, c2...

      for i in [0...@clusters]
         html = "<button href='#' id='c#{i}' class='btn btn-square checked'></button>"
         $("#menu").append(html)

      $(@allId).click(@onToggleAll)

      for i in [0...@clusters]
         $("#t" + String(i)).click( @onToggle )
         $("#c" + String(i)).click( @onToggle )
         $("#b" + String(i)).click( @onCluster )

      @updateSwatches()


   # Count how many toggles are on.
   togglesOn : ->

      result = 0

      for i in [0...@clusters]
         tag = "#c" + String(i)
         state = @getState tag
         if state is Menu.TOGGLE_ON then result++

      return result



   setAllOn: ->

      @setState @allId, Menu.TOGGLE_ON

      for i in [0...@clusters]
         tag = '#c' + String(i)
         @setState tag, Menu.TOGGLE_ON

      @notify(Menu.EVENT_TOGGLE_ALL_ON)



   setState: (tag, checked) ->

      if checked
         $(tag).addClass 'checked'
         # if not allId, get color else get all-clusters color
         if tag isnt @allId
            id = tag.replace("#c", "")
            index = parseInt(id)
            color = @colors[index].getStyle()
         else
            color = 'lightgrey'
         $(tag).css 'background-color', color
      else
         # if uncheck, make circle into a ring
         $(tag).removeClass 'checked'
         $(tag).css 'background-color', 'rgba(72, 72, 72, 1)'


   getState: (tag) ->

      return $(tag).hasClass 'checked'



   # Based on the state of all cluster toggles, set the master toggle.
   updateMasterToggle : () ->

      shown = @togglesOn()

      switch shown
         when 0 then @setState @allId, Menu.TOGGLE_OFF
         when @clusters then @setState @allId, Menu.TOGGLE_ON
         else @setState @allId, Menu.TOGGLE_MIX


   # Swatches have IDs: c0, c1, c2...
   updateSwatches : ->

      $(@allId).css 'background-color', 'lightgrey'

      for i in [0...@clusters]
         if i is @selected
            $("#c" + String(i)).css( 'color', Palette.HIGHLIGHT.getStyle() )
         else
            #$("#c" + String(i)).css( 'color', @colors[i].getStyle() )
            $("#c" + String(i)).css 'background-color', @colors[i].getStyle()
            $("#c" + String(i)).css 'border-color', @colors[i].getStyle()


   # Cluster buttons have IDs: b0, b1, b2...
   updateButtons : ->

      for i in [0...@clusters]
         if i is @selected
            $("#b" + String(i)).css( 'color', Palette.HIGHLIGHT.getStyle() )
         else
            $("#b" + String(i)).css( 'color', Palette.BUTTON.getStyle() )


module.exports = Menu
