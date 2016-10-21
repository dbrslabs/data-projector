# Projector.coffee
# Tomasz (Tomek) Zemla
# tomek@datacratic.com

# Projector class displays the data visualization.
# Images are rendered in WebGL on HTML5 Canvas using Three.js library.

# TODO Extend selection to work in ORTHOGRAPHIC and PERSPECTIVE, not only DUAL mode.

Subject = require('./Subject.coffee')
Utility = require('./Utility.coffee')
Palette = require('./Palette.coffee')
Selector = require('./Selector.coffee')

unless Array::filter
     Array::filter = (callback) ->
            element for element in this when callback(element)

class Projector extends Subject

   # E V E N T S

   @EVENT_DATA_LOADED : "EVENT_DATA_LOADED"
   @EVENT_POINTS_SELECTED : "EVENT_POINTS_SELECTED"
   @EVENT_CLUSTER_SELECTED : "EVENT_CLUSTER_SELECTED"

   # C O N S T A N T S

   # three view/display modes
   @VIEW : { NONE: -1, PERSPECTIVE: 0, ORTHOGRAPHIC: 1, DUAL: 2 }

   # spin clock or counter clockwise
   @SPIN : { LEFT: -1, NONE: 0, RIGHT: +1 }

   @SPIN_STEP : Utility.DEGREE / 10 # 0.1 degree - default step

   # M E M B E R S

   # these are pseudo constants which are redefined when browser resizes
   SCREEN_WIDTH : window.innerWidth - $('#sidebar-wrapper').width()
   SCREEN_HEIGHT : window.innerHeight

   mode : Projector.VIEW.PERSPECTIVE # starting default

   storage : null # reference to the data storage

   colors : null # Array<THREE.Color> generated color values for visualization

   scene : null # THREE.Scene

   # perspective (3D) and orthographic (2D) projection cameras

   cameraPerspective : null # THREE.PerspectiveCamera
   cameraOrthographic : null # THREE.OrthographicCamera

   renderer : null # THREE.WebGLRenderer

   # mouse tracking variables
   mouse : new THREE.Vector3() # current mouse coordinates when selecting
   mouseStart : new THREE.Vector3() # mouse down coordinates when selecting
   mouseEnd : new THREE.Vector3() # mouse up coordinates when selecting
   dragging : false # true when rubber banding...

   selector : null # Selector

   # visual helpers for data display
   box : null # THREE.Mesh - data cage
   viewport : null # parent of selectable view rectangles
   direction : Utility.DIRECTION.TOP # default 2D view is from top
   view1 : null # THREE.Line - 2D orthographic view box - top
   view2 : null # THREE.Line - 2D orthographic view box - front
   view3 : null # THREE.Line - 2D orthographic view box - side

   # visual representations of loaded data
   points : null # Array<THREE.Geometry>
   particles : null # Array<THREE.Points>
   clusters : null # array of particle systems one per cluster

   selected : -1 # currently selected cluster

   controls : null # THREE.TrackballControls

   timeStamp : 0

   # C O N S T R U C T O R

   # Create projector.
   # Constructor creates all initial setup to make projector ready for data.
   constructor: ->

      super()

      @addUIListeners() # listen for UI events

      @scene = new THREE.Scene() # 3D world

      @createPerspectiveCamera() # left side (dual mode): 3D perspective camera
      @createOrthographicCamera() # right side (dual mode): 2D ortographic projection camera

      @createControls() # trackball simulation controls

      @createBox() # bounding box for the data
      # @box.visible = false # hide cube

      @cameraPerspective.lookAt( @box.position )
      @cameraOrthographic.lookAt( @box.position )

      @createViews()
      @updateView(true)

      @setViewsVisible(false, false, false); # hide square

      @selector = new Selector(@box) # 3D rubber band selector

      @createRenderingEngine() # set up WebGL renderer on canvas

      @onWindowResize(null)

      @animate() # start rendering loop!

      @setTooltips()

      @setLegend()

      # detect if mobile
      @mobileWeb = /Mobile|iP(hone|od|ad)|Android|BlackBerry|IEMobile|Kindle|NetFront|Silk-Accelerated|(hpw|web)OS|Fennec|Minimo|Opera M(obi|ini)|Blazer|Dolfin|Dolphin|Skyfire|Zune/i.test(navigator.userAgent)


   # E V E N T   H A N D L E R S

   # New controls! ~ .dh
   $('.btn-toggle').click ->
      #$(this).find('.btn').toggleClass 'active'
      if $(this).find('.btn-primary').size() > 0
         $(this).find('.btn').toggleClass 'btn-primary'
      $(this).find('.btn').toggleClass 'btn-default'

   #TODO: figure out what the prod url for this is
   getPointDetails : (docid) =>
     $.ajax
         url: "http://localhost:5000/guardian-galaxy-api/doc/" + docid
         dataType: "json"
         error: (jqXHR, textStatus, errorThrown) ->
            console.log "AJAX Error: #{textStatus}"
         success: @makeTooltip

   findPoint : (cid, docid) => # maybe pass along cid to make search faster?
      @getPointDetails(docid)
      console.log(docid)
      mDocs = @points[cid].documents
      i = 0
      for d in mDocs
         if d.id is docid
            return d
         i++
      return {}
           #console.log @points[cid].colors[d]


   setTooltips: () =>
      canvas1 = document.createElement('canvas')
      ctx = canvas1
      dpr = window.devicePixelRatio or 1
      bsr = ctx.webkitBackingStorePixelRatio or ctx.mozBackingStorePixelRatio or ctx.msBackingStorePixelRatio or ctx.oBackingStorePixelRatio or ctx.backingStorePixelRatio or 1
      ratio = dpr / bsr
      w = canvas1.width
      h = canvas1.height
      canvas1.width =  w * ratio
      canvas1.height =  h * ratio
      console.log ratio
      #canvas1.style.width =  + "px"
      #canvas1.style.height = h + "px"
      canvas1.getContext("2d").setTransform(ratio, 0, 0, ratio, 0, 0)
      canvas1.retinaResoultionEnabled = false
      @context1 = canvas1.getContext('2d')
      @context1.font = '5px PT Sans'
      @context1.fillStyle = 'rgba(0,0,0,0.95)'
      #@context1.fillText '', 0, 20

      # canvas contents will be used for a texture
      @texture1 = new (THREE.Texture)(canvas1)
      @texture1.minFilter = THREE.LinearFilter # doesnt need to be power of 2
      @texture1.needsUpdate = true
      @texture1.generateMipmaps = false

      #//////////////////////////////////////
      spriteMaterial = new (THREE.SpriteMaterial)({
      map: @texture1
      useScreenCoordinates: true})
      @sprite1 = new (THREE.Sprite)(spriteMaterial)
      @sprite1.scale.set 200, 100, 1.0
      @sprite1.position.set 50, 50, 0
      @scene.add @sprite1


   setLegend: () =>
      canvas2 = document.createElement('canvas')
      ctx = canvas2
      ratio =1
      canvas2.getContext("2d").setTransform(ratio, 0, 0, ratio, 0, 0)
      canvas2.retinaResoultionEnabled = false
      @context2 = canvas2.getContext('2d')
      @context2.font = '10px PT Sans'
      @context2.fillStyle = 'rgba(0,0,0,0.95)'
      @context2.fillText 'Test legend', 0, 20

      # canvas contents will be used for a texture
      @texture2 = new (THREE.Texture)(canvas2)
      @texture2.minFilter = THREE.LinearFilter # doesnt need to be power of 2
      @texture2.needsUpdate = false
      @texture2.generateMipmaps = false

      #//////////////////////////////////////
      spriteMaterial = new (THREE.SpriteMaterial)({
      map: @texture2
      useScreenCoordinates: true})
      @sprite2 = new (THREE.Sprite)(spriteMaterial)
      @sprite2.scale.set 200, 100, 1.0
      @sprite2.position.set 50, 50, 0
      @scene2 = new THREE.Scene()
      @scene2.add @sprite2


   # Make updates related to window size changes.
   # Also used when view configuration is switched.
   onWindowResize : (event) =>

      @SCREEN_WIDTH = window.innerWidth - $('#sidebar-wrapper').width()
      @SCREEN_HEIGHT = window.innerHeight

      #console.log "Screen #{@SCREEN_WIDTH} x #{@SCREEN_HEIGHT}"
      #alert "Resized!"

      if @renderer?

         @renderer.setSize( @SCREEN_WIDTH, @SCREEN_HEIGHT )

         switch @mode

            when Projector.VIEW.PERSPECTIVE
               @cameraPerspective.aspect = @SCREEN_WIDTH / @SCREEN_HEIGHT
               @cameraPerspective.updateProjectionMatrix()

            when Projector.VIEW.ORTHOGRAPHIC
               @cameraOrthographic.left   = - (@SCREEN_WIDTH / 8)
               @cameraOrthographic.right  = + (@SCREEN_WIDTH / 8)
               @cameraOrthographic.top    = + (@SCREEN_HEIGHT / 8)
               @cameraOrthographic.bottom = - (@SCREEN_HEIGHT / 8)
               @cameraOrthographic.updateProjectionMatrix()

            when Projector.VIEW.DUAL
               # left side
               @cameraPerspective.aspect = 0.5 * @SCREEN_WIDTH / @SCREEN_HEIGHT
               @cameraPerspective.updateProjectionMatrix()
               # right side
               @cameraOrthographic.left   = - (@SCREEN_WIDTH / 10)
               @cameraOrthographic.right  = + (@SCREEN_WIDTH / 10)
               @cameraOrthographic.top    = + (@SCREEN_HEIGHT / 5)
               @cameraOrthographic.bottom = - (@SCREEN_HEIGHT / 5)
               @cameraOrthographic.updateProjectionMatrix()

      @controls.handleResize()


   getTooltip: () =>
      return ''

   roundRect: (ctx, x, y, width, height, radius, fill, stroke) ->
      if typeof stroke == 'undefined'
         stroke = true
      if typeof radius == 'undefined'
         radius = 5
      if typeof radius == 'number'
         radius =
            tl: radius
            tr: radius
            br: radius
            bl: radius
      else
         defaultRadius =
            tl: 0
            tr: 0
            br: 0
            bl: 0
         for side of defaultRadius
            radius[side] = radius[side] or defaultRadius[side]
      ctx.beginPath()
      ctx.moveTo x + radius.tl, y
      ctx.lineTo x + width - (radius.tr), y
      ctx.quadraticCurveTo x + width, y, x + width, y + radius.tr
      ctx.lineTo x + width, y + height - (radius.br)
      ctx.quadraticCurveTo x + width, y + height, x + width - (radius.br), y + height
      ctx.lineTo x + radius.bl, y + height
      ctx.quadraticCurveTo x, y + height, x, y + height - (radius.bl)
      ctx.lineTo x, y + radius.tl
      ctx.quadraticCurveTo x, y, x + radius.tl, y
      ctx.closePath()
      if fill
         ctx.fill()
      if stroke
         ctx.stroke()
      return

   # wrap text on a canvas context
   wrapText: (context, text, x, y, maxWidth, maxHeight, lineHeight) ->
      console.log 'inside wrap text'
      cars = text.split('\n')
      console.log cars
      ii = 0
      while ii < cars.length
         line = ''
         words = cars[ii].split(' ')
         n = 0
         while n < words.length
            testLine = line + words[n] + ' '
            metrics = context.measureText(testLine)
            testWidth = metrics.width
            if testWidth > maxWidth
               context.fillText line, x + 0.5, y + 0.5
               line = words[n] + ' '
               y += lineHeight
            else
               line = testLine
            n++
         context.fillText line, x, y
         y += lineHeight
         ii++
      return y

   onMouseDown : (event) =>


      if @mode is Projector.VIEW.DUAL

         event.preventDefault()

         if event.shiftKey

            @dragging = true
            @updateMouse3D()
            @mouseStart.copy(@mouse)
            @selector.start(@mouseStart.clone())

            event.stopPropagation()


   onMouseMove : (event) =>

      if @mode is Projector.VIEW.DUAL

         event.preventDefault()

         if @dragging

            @updateMouse3D()
            @selector.update(@mouse)

            event.stopPropagation()

      # for tooltips
      @sprite1.position.set event.clientX, event.clientY - 20, 0
      @mouse.x = event.clientX / window.innerWidth * 2 - 1
      @mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

      threshold = 1
      raycaster = new (THREE.Raycaster)
      raycaster.params.Points.threshold = threshold
      # TODO: delete this
      #console.log @findPoint(0,'56f3172cd4f5ca1daeb6539b')
      # create once
      mouse = new (THREE.Vector2)
      mouse.x = event.clientX / @renderer.domElement.width * 2 - 1
      mouse.y = -(event.clientY / @renderer.domElement.height) * 2 + 1
      raycaster.setFromCamera mouse, @cameraPerspective
      recursiveFlag = false
      # only get visible particle clouds
      filtered_particles = @particles.filter (x) -> x.visible
      if filtered_particles
         intersects = raycaster.intersectObjects(filtered_particles, false)
         if intersects.length > 0
            index = intersects[0].index
            cid = intersects[0].object.geometry.vertices[0].cid
            point = @particles[cid].geometry.vertices[ index ]
            @getPointDetails(point.name)
            @intersects = intersects


   makeTooltip: (pointData) =>
      rectX = 0
      rectY = 0
      rectWidth = 100
      rectHeight = height
      @context1.clearRect 0, 0, 640, 500
      @context1.font = '5px PT Sans'

      metrics = @context1.measureText(pointData.title)
      console.log(metrics)
      width = rectWidth
      height = 100
      # add some opacity
      @context1.globalAlpha = 0.7
      @context1.strokeStyle = "#2d6"
      @context1.fillStyle = "#444444"
      radius = 5
      @roundRect(@context1, 2, 2, width+4, height+4, radius, true, false)
      # text color
      @context1.fillStyle ="#FFF"
      lastY = @wrapText(@context1, pointData.title, 4, 20, width,  rectHeight, 10)
      lastY = @wrapText(@context1, pointData.date, 4, lastY, width, rectHeight, 10)
      @wrapText(@context1, "Keywords: " + pointData.keywords.join(", "), 4, lastY, width, rectHeight, 10)




      @texture1.needsUpdate = true

      @sprite1.position.copy @intersects[0].point

   onMouseUp : (event) =>
      if @mode is Projector.VIEW.DUAL

         event.preventDefault()

         if @dragging

            @dragging = false
            @updateMouse3D()
            @mouseEnd.copy(@mouse)
            @selector.end(@mouseEnd.clone())
            @updateSelection()

            event.stopPropagation()


   # Toggle next cluster during the animated walk through.
   onTimer : (index) =>

      @toggleClusterVisibility(index)
      if ++index is @storage.getClusters() then index = 0
      if @animateOn then @startTimer(index)


   # M E T H O D S

   # Set the current mode.
   setMode : (@mode) =>

      @onWindowResize(null)


   # Use given color set for visualization.
   setColors : (@colors) =>


   # Toggle box visibility. Return current state.
   toggleBox : => return (@box.visible = not @box.visible)


   # Toggle viewport visibility. Return current state.
   toggleViewport : => return @updateView(not @viewport.visible)


   toggleSelector : =>

      state = @selector.toggle()
      @updateSelection()
      return state


   # Get the base 64 encoded image of the current state of the projector.
   getImage : =>

      return document.getElementById("renderer").toDataURL("image/png")


   # Hook up to browser and mouse events.
   addUIListeners : =>

      window.addEventListener('resize', @onWindowResize, false)

      # container will hold WebGL canvas

      $('#container').mousedown(@onMouseDown)
      $('#container').mousemove(@onMouseMove)
      $('#container').mouseup(@onMouseUp)


   # Proper 3D camera.
   createPerspectiveCamera : =>

      # NOTE Cameras aspect ratio setup matches the half screen viewports for initial dual mode

      @cameraPerspective = new THREE.PerspectiveCamera( 50, 0.5 * @SCREEN_WIDTH / @SCREEN_HEIGHT, 150, 1000 )
      @cameraPerspective.position.set(0, 0, 350)
      @scene.add( @cameraPerspective )


   # Flat, 2D, no perspective camera.
   createOrthographicCamera : =>

      @cameraOrthographic = new THREE.OrthographicCamera( - (@SCREEN_WIDTH / 8),
                                                          + (@SCREEN_WIDTH / 8),
                                                          + (@SCREEN_HEIGHT / 4),
                                                          - (@SCREEN_HEIGHT / 4),
                                                          250, 750 )
      @cameraOrthographic.position.set(0, 500, 0)
      @scene.add( @cameraOrthographic )


   # Initialize simulated trackball navigation controls
   createControls : =>
      viz_container = document.getElementById( "container" )

      @controls = new THREE.TrackballControls( @cameraPerspective, viz_container )

      @controls.rotateSpeed = 1.0
      @controls.zoomSpeed = 1.0
      @controls.panSpeed = 0.8

      @controls.noZoom = false
      @controls.noPan = false

      @controls.staticMoving = true
      @controls.dynamicDampingFactor = 0.3

      @controls.addEventListener('change', @render)


   # Bounding box where the data is displayed.
   createBox : =>

      @box = new THREE.Mesh(new THREE.CubeGeometry(200, 200, 200),
                            new THREE.MeshBasicMaterial({ color: 0x404040, wireframe: true }))
      @scene.add(@box)


   # Create a set of highlights that indicate ortographic projection in perspective view.
   # Each rectangle simply indicates where 2D view is within the 3D space.
   createViews : =>

      @viewport = new THREE.Object3D()

      # top view
      geometry1 = new THREE.Geometry()
      geometry1.vertices.push( new THREE.Vector3( +100, +101, +100 ) )
      geometry1.vertices.push( new THREE.Vector3( -100, +101, +100 ) )
      geometry1.vertices.push( new THREE.Vector3( -100, +101, -100 ) )
      geometry1.vertices.push( new THREE.Vector3( +100, +101, -100 ) )
      geometry1.vertices.push( new THREE.Vector3( +100, +101, +100 ) )

      @view1 = new THREE.Line(geometry1, new THREE.LineBasicMaterial(), THREE.LineStrip)

      # front view
      geometry2 = new THREE.Geometry()
      geometry2.vertices.push( new THREE.Vector3( +100, +100, +101 ) )
      geometry2.vertices.push( new THREE.Vector3( -100, +100, +101 ) )
      geometry2.vertices.push( new THREE.Vector3( -100, -100, +101 ) )
      geometry2.vertices.push( new THREE.Vector3( +100, -100, +101 ) )
      geometry2.vertices.push( new THREE.Vector3( +100, +100, +101 ) )

      @view2 = new THREE.Line(geometry2, new THREE.LineBasicMaterial(), THREE.LineStrip)

      # side view
      geometry3 = new THREE.Geometry()
      geometry3.vertices.push( new THREE.Vector3( +101, +100, +100 ) )
      geometry3.vertices.push( new THREE.Vector3( +101, -100, +100 ) )
      geometry3.vertices.push( new THREE.Vector3( +101, -100, -100 ) )
      geometry3.vertices.push( new THREE.Vector3( +101, +100, -100 ) )
      geometry3.vertices.push( new THREE.Vector3( +101, +100, +100 ) )

      @view3 = new THREE.Line(geometry3, new THREE.LineBasicMaterial(), THREE.LineStrip)

      @viewport.add(@view1) # top
      @viewport.add(@view2) # front
      @viewport.add(@view3) # side

      @box.add(@viewport)


   createRenderingEngine : =>

      # basically canvas in WebGL mode
      @renderer = new THREE.WebGLRenderer( { antialias: true, preserveDrawingBuffer: true } )
      @renderer.setSize( @SCREEN_WIDTH, @SCREEN_HEIGHT )
      @renderer.setClearColor( Palette.BACKGROUND.getHex(), 1 )
      @renderer.domElement.style.position = "relative"
      @renderer.domElement.id = "renderer"
      @renderer.autoClear = false

      # container is the display area placeholder in HTML
      container = $('#container').get(0)
      container.appendChild( @renderer.domElement )

   # Load JSON data to visualize.
   load : (@storage) =>

      # first, remove visible points
      # we do not want to remove the first 4 objects in the box
      @box.remove(@box.children[4]) while @box.children.length > 4

      data = @storage.getData() # JSON
      clusters = @storage.getClusters() # number of clusters

      # create point clouds first for each cluster

      @points = new Array()

      for c in [0...clusters]
         @points[c] = new THREE.Geometry()
         @points[c].colorsNeedUpdate = true
         @points[c].documents = new Array()

      # process JSON data
      $.each(data.points, @processPoint)

      # create particle systems for each cluster (with point clouds within)

      @particles = new Array()

      for p in [0...clusters]
         material = new THREE.ParticleBasicMaterial( { size: 2.0, sizeAttenuation: false, vertexColors: true } )
         #@particles[p] = new THREE.ParticleSystem( @points[p], material )
         @particles[p] = new THREE.Points( @points[p], material )
         @box.add( @particles[p] ) # put them in the data cage

      @notify(Projector.EVENT_DATA_LOADED)



   # Called for each data point loaded in JSON file.
   processPoint : (nodeName, nodeData) =>

      # cluster index
      index = parseInt(nodeData.cid)
      vertex = new THREE.Vector3()
      vertex.x = parseFloat( nodeData.x )
      vertex.y = parseFloat( nodeData.y )
      vertex.z = parseFloat( nodeData.z )
      vertex.cid = nodeData.cid
      vertex.name = nodeData.document.id
      @points[index].vertices.push( vertex )

      # NOTE Although initially all points in the same cluster have the same color
      # they do take individual colors during the selection interactions therefore
      # each point needs its own individual color object instead of shared one...

      color = @colors[index].clone()
      @points[index].colors.push( color )

      # track corresponding document metadata
      @points[index].documents.push( nodeData.document )


   # Rendering loop - animate calls itself forever.
   animate : =>

      requestAnimationFrame( @animate )
      @controls.update()
      @render()


   # Rendering done on each frame.
   # Rendering configuration depends on the current view mode.
   render : =>

      @renderer.clear()

      switch @mode

         # one viewport: perspective camera only
         when Projector.VIEW.PERSPECTIVE
            if @spin isnt Projector.SPIN.NONE then @spinCamera()
            @cameraPerspective.lookAt( @box.position )
            # RENDERING
            @renderer.setViewport( 0, 0, @SCREEN_WIDTH, @SCREEN_HEIGHT )
            @renderer.render( @scene, @cameraPerspective )

         # one viewport: orthographic camera only
         when Projector.VIEW.ORTHOGRAPHIC
            # RENDERING
            @cameraOrthographic.rotation.z = 0
            @renderer.setViewport( 0, 0, @SCREEN_WIDTH, @SCREEN_HEIGHT )
            @renderer.render( @scene, @cameraOrthographic )

         # dual perspective and orthographic cameras view
         when Projector.VIEW.DUAL
            # synchronize camera with rotation
            if @spin isnt Projector.SPIN.NONE then @spinCamera()
            @cameraPerspective.lookAt( @box.position )
            # RENDERING
            # left side viewport: perspective camera
            @renderer.setViewport( 0, 0, @SCREEN_WIDTH/2, @SCREEN_HEIGHT )
            @renderer.render( @scene, @cameraPerspective )
            # right side viewport: orthographic camera
            @cameraOrthographic.rotation.z = 0
            @renderer.setViewport( @SCREEN_WIDTH/2, 0, @SCREEN_WIDTH/2, @SCREEN_HEIGHT )
            @renderer.render( @scene, @cameraOrthographic )


   getVisibleDocuments : =>

      # algorithm:
      # loop through all clusters
      # if cluster is visible then process it
      # for each point check if it's inside selection
      # if inside (and selector is active) set color to highlight
      # else set color to original cluster color

      documents = new Array()

      clusters = @storage.getClusters()

      #console.log Object.getOwnPropertyNames(clusters)
      #console.log clusters.className

      #for i in [0...@storage.getClusters()]
      for i in [0...clusters]
         #console.log i
         if @particles[i].visible
            cloud = @points[i]
            all = cloud.vertices.length
            for j in [0...all]
               vertex = cloud.vertices[j]
               document = cloud.documents[j]
               # Add cluster ID because it isn't included by default
               document.cid = i
               if not @selector.isActive()
                  documents.push( document )
               if @selector.isActive() and @selector.contains(vertex, Utility.DIRECTION.ALL)
                  documents.push( document )

            cloud.colorsNeedUpdate = true;

      return { documents: documents }


   updateSelection : =>

      # algorithm:
      # loop through all clusters
      # if cluster is visible then process it
      # for each point check if it's inside selection
      # if inside (and selector is active) set color to highlight
      # else set color to original cluster color

      counter = 0
      documents = new Array()

      for i in [0...@storage.getClusters()]
         if @particles[i].visible
            cloud = @points[i]
            all = cloud.vertices.length
            for j in [0...all]
               vertex = cloud.vertices[j]
               color = cloud.colors[j]
               document = cloud.documents[j]
               if not @selector.isActive()
                  documents.push( document )
               if @selector.isActive() and @selector.contains(vertex, Utility.DIRECTION.ALL)
                  color.setHex(Palette.HIGHLIGHT.getHex())
                  counter++
                  documents.push( document )
                  # Utility.printVector3(vertex)
               else
                  color.setHex(@colors[i].getHex())

            cloud.colorsNeedUpdate = true;

      @notify(Projector.EVENT_POINTS_SELECTED, { documents: documents, points : counter })


   updateMouse3D : =>

      # NOTE This works only in DUAL mode
      # TODO Extend this to other modes

      ratio = 100 / 250 # ?

      switch @direction
         when Utility.DIRECTION.TOP
            @mouse.x = (event.pageX - (3 * @SCREEN_WIDTH / 4)) * ratio
            @mouse.y = 100
            @mouse.z = (event.pageY - (@SCREEN_HEIGHT / 2)) * ratio
         when Utility.DIRECTION.FRONT
            @mouse.x = (event.pageX - (3 * @SCREEN_WIDTH / 4)) * ratio
            @mouse.y = - (event.pageY - (@SCREEN_HEIGHT / 2)) * ratio
            @mouse.z = 100
         when Utility.DIRECTION.SIDE
            @mouse.x = 100
            @mouse.y = - (event.pageY - (@SCREEN_HEIGHT / 2)) * ratio
            @mouse.z = - (event.pageX - (3 * @SCREEN_WIDTH / 4)) * ratio


   # Returns 3D camera to its starting orientation and optionally position.
   # Position is only reset if location argument is true.
   resetCamera : (location) =>

      if location then TweenLite.to( @cameraPerspective.position, 1, {x:0, y:0, z:550} )
      TweenLite.to( @cameraPerspective.rotation, 1, {x:0, y:0, z:0} )
      TweenLite.to( @cameraPerspective.up, 1, {x:0, y:1, z:0} )


   # Set the visibility of orthographic view (top, front, side) indicator.
   updateView : (visible) =>

      @viewport.visible = visible

      # NOTE Changing visibility of the viewport alone does not work as the change
      # of visibility of the parent is an ongoing bug/issue of the ThreeJS library...
      # ...so toggle all three separately

      if @viewport.visible
         switch @direction
            when Utility.DIRECTION.TOP
               @setViewsVisible(true, false, false)
               @cameraOrthographic.position.set(0, 500, 0)
            when Utility.DIRECTION.FRONT
               @setViewsVisible(false, true, false)
               @cameraOrthographic.position.set(0, 0, 500)
            when Utility.DIRECTION.SIDE
               @setViewsVisible(false, false, true)
               @cameraOrthographic.position.set(500, 0, 0)
         @cameraOrthographic.lookAt(@box.position)
      else
         @setViewsVisible(false, false, false)

      return @viewport.visible


   # Set visibility of view indicators.
   setViewsVisible : (top, front, side) =>

         @view1.visible = top
         @view2.visible = front
         @view3.visible = side


   changeView : (@direction) =>

      @updateView(@viewport.visible)
      @selector.setDirection(@direction)


   toggleAnimation : =>

      @animateOn = not @animateOn

      if @animateOn
         @setAllClustersVisible(false)
         @startTimer(0)
      else
         @setAllClustersVisible(true)

      return @animateOn


   toggleSpin : =>

      if @spinOn
         @setSpin(Projector.SPIN.RIGHT)
      else
         @setSpin(Projector.SPIN.NONE)

      @spinOn = not @spinOn


   setSpin : (@spin) =>

      switch @spin

         when Projector.SPIN.LEFT
            @resetCamera(false)

         when Projector.SPIN.NONE
            @timeStamp = 0

         when Projector.SPIN.RIGHT
            @resetCamera(false)


   # Spin camera in a circle around the center.
   spinCamera : =>

      STEP = @getSpinStep()

      cx = @cameraPerspective.position.x
      cy = -1 * @cameraPerspective.position.z
      radians = Math.atan2(cy, cx)
      radius = Math.sqrt(cx * cx + cy * cy)

      switch @spin

         when Projector.SPIN.LEFT
            radians += STEP
            if radians > Math.PI then radians = radians - (2 * Math.PI)

         when Projector.SPIN.RIGHT
            radians -= STEP
            if radians < -Math.PI then radians = (2 * Math.PI) + radians

      x = radius * Math.cos(radians)
      y = radius * Math.sin(radians)

      @cameraPerspective.position.x = x
      @cameraPerspective.position.z = -1 * y


   # Adjust the rotation step depending on time elapsed between the frames.
   getSpinStep : =>

      step = Projector.SPIN_STEP # default

      if @timeStamp isnt 0
         date = new Date()
         timeNow = date.getTime()
         delta = timeNow - @timeStamp
         @timeStamp = timeNow
         step = delta * step / 10

      return step


   # Toggle visibility of the cluster given by its index.
   toggleClusterVisibility : (index) =>

      @particles[index].visible = not @particles[index].visible


   setAllClustersVisible : (visible) =>

      p.visible = visible for p in @particles


   # Select or unselect cluster of given index.
   toggleClusterSelection : (index) =>

      # clear old selected
      if @selected > -1
         # restore color coding on previous selection
         hexColor = @colors[@selected].getHex()
         @updatePoints(@selected, hexColor)

      if @selected is index
         # unselecting
         @selected = -1
      else
         # selecting
         @selected = index
         # highlight new selected
         @updatePoints(@selected, Palette.HIGHLIGHT.getHex())

      if @selected > -1
         @notify(Projector.EVENT_CLUSTER_SELECTED, { id : index })
      else
         @notify(Projector.EVENT_CLUSTER_SELECTED, { id : -1 })


   # Color code given points cloud (cluster).
   updatePoints : (index, color) =>

      cloud = @points[index]
      all = cloud.vertices.length

      for i in [0...all]
         cloud.colors[i].setHex(color)

      @points[index].colorsNeedUpdate = true


   startTimer : (index) =>

      @toggleClusterVisibility(index)
      window.setTimeout(@onTimer, 2 * Utility.SECOND, index)


   # Count visible clusters.
   clustersVisible : =>

      result = 0

      result++ for cloud in @particles when cloud.visible

      return result


module.exports = Projector


