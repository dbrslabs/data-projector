###* This EventsControls will allow to facilitate development speed for simple manipulations by means of a mouse
* - point and click, drag and drop.
* @author Vildanov Almaz / alvild@gmail.com
* R18 version 10.10.2015.
###

# intersects = raycaster.intersectObjects( objects );
# =>
# intersects[ 0 ].object = this.focused
#     OR
# intersects[ 0 ].object = this.mouseOvered
# this.event = intersects[ 0 ];
# this.event.item - number of the selected object
# this.event.distance - distance between the origin of the ray and the intersection
# this.event.point - point of intersection, in world coordinates
# this.event.face - intersected face
# this.event.faceIndex - index of the intersected face
# this.event.indices - indices of vertices comprising the intersected face
THREE.Object3D.userDataParent = null
THREE.Mesh.userDataParent = null

EventsControls = (camera, domElement) ->
  _this = this

  getMousePos = (event) ->
    if _this.enabled
      x = if event.offsetX == undefined then event.layerX else event.offsetX
      y = if event.offsetY == undefined then event.layerY else event.offsetY
      _this._mouse.x = x / _this.container.width * 2 - 1
      _this._mouse.y = -(y / _this.container.height) * 2 + 1
      onContainerMouseMove()
      if _mouseMoveFlag
        _this.mouseMove()
    return

  onContainerMouseDown = (event) ->
    if _this.enabled and (_onclickFlag or _dragAndDropFlag)
      if _this.focused
        return
      _this._raySet()
      _this.intersects = _this.raycaster.intersectObjects(_this.objects, true)
      if _this.intersects.length > 0
        _this.event = _this.intersects[0]
        _this.setFocus _this.intersects[0].object
        if _dragAndDropFlag
          _this.intersects = _this.raycaster.intersectObject(_this.map)
          try
            if _this.offsetUse
              pos = (new (THREE.Vector3)).copy(_this.focused.position)
              pos.x = pos.x / _this.scale.x
              pos.y = pos.y / _this.scale.y
              pos.z = pos.z / _this.scale.z
              _this.offset.subVectors _this.intersects[0].point, pos
              #console.log( _this.offset );
            #_this.offset.copy( _this.intersects[ 0 ].point ).sub( _this.map.position );
          catch err
        _this.onclick()
      else
        _this.removeFocus()
        _this.event = null
    return

  onContainerMouseMove = ->
    _this._raySet()
    if _this.focused
      if _dragAndDropFlag
        _DisplaceIntersectsMap = _this.raycaster.intersectObject(_this.map)
        #_this._setMap();
        try
          pos = (new (THREE.Vector3)).copy(_DisplaceIntersectsMap[0].point.sub(_this.offset))
          pos.x *= _this.scale.x
          pos.y *= _this.scale.y
          pos.z *= _this.scale.z
          _this.focused.position.copy pos
        catch err
        _this.dragAndDrop()
    else
      if _mouseOverFlag
        _DisplaceIntersects = _this.raycaster.intersectObjects(_this.objects, true)
        _this.intersects = _DisplaceIntersects
        if _this.intersects.length > 0
          _this.event = _this.intersects[0]
          if _this.mouseOvered
            if _DisplacemouseOvered != _this.intersects[0].object
              _this.mouseOut()
              _this.select _this.intersects[0].object
              _this.mouseOver()
          else
            _this.select _this.intersects[0].object
            _this.mouseOver()
        else
          if _DisplacemouseOvered
            _this.mouseOut()
            _this.deselect()
    if _this.focused
      if _this.collidable
        originPoint = _this.focused.position.clone()
        vertexIndex = 0
        while vertexIndex < _this.focused.geometry.vertices.length
          localVertex = _this.focused.geometry.vertices[vertexIndex].clone()
          globalVertex = _this.focused.localToWorld(localVertex)
          directionVector = (new (THREE.Vector3)).copy(globalVertex)
          directionVector.sub _this.focused.position
          _this.raycaster.set originPoint, directionVector.clone().normalize()
          collisionResults = _this.raycaster.intersectObjects(_this.collidableEntities)
          if collisionResults.length > 0 and collisionResults[0].distance < directionVector.length()
            _this.collision()
            break
          vertexIndex++
    #}
    return

  onContainerMouseUp = (event) ->
    if _this.enabled
      if _this.focused
        _this.mouseUp()
        _DisplaceFocused = null
        _this.focused = null
    return

  @camera = camera
  @container = if domElement != undefined then domElement else document
  _DisplaceFocused = null
  # выделенный объект
  @focused = null
  # выделенный объект
  @focusedChild = null
  # выделенная часть 3D объекта
  @previous = new (THREE.Vector3)
  # предыдущие координаты выделенного объекта
  _DisplacemouseOvered = null
  # наведенный объект
  @mouseOvered = null
  # наведенный объект
  @mouseOveredChild = null
  # наведенная часть 3D объекта
  @raycaster = new (THREE.Raycaster)
  @map = null
  @event = null
  @offset = new (THREE.Vector3)
  @offsetUse = false
  @scale = new (THREE.Vector3)(1, 1, 1)
  @_mouse = new (THREE.Vector2)
  @mouse = new (THREE.Vector2)
  @_vector = new (THREE.Vector3)
  @_direction = new (THREE.Vector3)
  @collidable = false
  @collidableEntities = []

  @collision = ->
    console.log 'collision!'
    return

  # API
  @enabled = true
  @objects = []
  _DisplaceIntersects = []
  _DisplaceIntersectsMap = []
  @intersects = []
  @intersectsMap = []

  @update = ->
    if _this.enabled
      onContainerMouseMove()
      if _mouseMoveFlag
        _this.mouseMove()
    return

  @dragAndDrop = ->

  # this.container.style.cursor = 'move';

  @mouseOver = ->

  # this.container.style.cursor = 'pointer';

  @mouseOut = ->

  # this.container.style.cursor = 'auto';

  @mouseUp = ->

  # this.container.style.cursor = 'auto';

  @mouseMove = ->

  @onclick = ->

  @attach = (object) ->
    if object instanceof THREE.Mesh
      @objects.push object
    else
      @objects.push object
      i = 0
      while i < object.children.length
        object.children[i].userDataParent = object
        i++
    return

  @detach = (object) ->
    item = _this.objects.indexOf(object)
    @objects.splice item, 1
    return

  _mouseOverFlag = false
  _mouseOutFlag = false
  _dragAndDropFlag = false
  _mouseUpFlag = false
  _onclickFlag = false
  _mouseMoveFlag = false

  @attachEvent = (event, handler) ->
    switch event
      when 'mouseOver'
        @mouseOver = handler
        _mouseOverFlag = true
      when 'mouseOut'
        @mouseOut = handler
        _mouseOutFlag = true
      when 'dragAndDrop'
        @dragAndDrop = handler
        _dragAndDropFlag = true
      when 'mouseUp'
        @mouseUp = handler
        _mouseUpFlag = true
      when 'onclick'
        @onclick = handler
        _onclickFlag = true
      when 'mouseMove'
        @mouseMove = handler
        _mouseMoveFlag = true
        break
    return

  @detachEvent = (event) ->
    switch event
      when 'mouseOver'
        _mouseOverFlag = false
      when 'mouseOut'
        _mouseOutFlag = false
      when 'dragAndDrop'
        _dragAndDropFlag = false
      when 'mouseUp'
        _mouseUpFlag = false
      when 'onclick'
        _onclickFlag = false
      when 'mouseMove'
        _mouseMoveFlag = false
        break
    return

  @setFocus = (object) ->
    _DisplaceFocused = object
    _this.event.item = _this.objects.indexOf(object)
    if object.userDataParent
      @focused = object.userDataParent
      @focusedChild = _DisplaceFocused
      @previous.copy @focused.position
    else
      @focused = object
      @focusedChild = null
      @previous.copy @focused.position
    return

  @removeFocus = ->
    _DisplaceFocused = null
    @focused = null
    @focusedChild = null
    @event = null
    return

  @select = (object) ->
    _DisplacemouseOvered = object
    _this.event.item = _this.objects.indexOf(object)
    if object.userDataParent
      @mouseOvered = object.userDataParent
      @mouseOveredChild = _DisplacemouseOvered
    else
      @mouseOvered = object
      @mouseOveredChild = null
    return

  @deselect = ->
    _DisplacemouseOvered = null
    @mouseOvered = null
    @mouseOveredChild = null
    @event = null
    return

  @returnPrevious = ->
    _this.focused.position.copy @previous
    return

  @_raySet = ->
    if _this.camera instanceof THREE.OrthographicCamera
      _this._vector.set(_this._mouse.x, _this._mouse.y, -1).unproject _this.camera
      _this._direction.set(0, 0, -1).transformDirection _this.camera.matrixWorld
      _this.raycaster.set _this._vector, _this._direction
    else
      vector = new (THREE.Vector3)(_this._mouse.x, _this._mouse.y, 1)
      #_this._projector.unprojectVector( vector, camera );
      vector.unproject _this.camera
      # _this.raycaster = new THREE.Raycaster( _this.camera.position, vector.sub( _this.camera.position ).normalize() );
      _this.raycaster.set _this.camera.position, vector.sub(_this.camera.position).normalize()
    return

  @_setMap = ->
    _this.intersectsMap = _DisplaceIntersectsMap
    return

  @container.addEventListener 'mousedown', onContainerMouseDown, false
  # мышка нажата
  @container.addEventListener 'mousemove', getMousePos, false
  # получение координат мыши
  @container.addEventListener 'mouseup', onContainerMouseUp, false
  # мышка отпущена
  return

# ---
# generated by js2coffee 2.2.0
