(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var DataProjector, Info, Menu, Observer, Palette, Projector, SidePanel, Storage, Subject, Toolbar, Utility, dataProjector,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Subject = require('./Subject.coffee');

Observer = require('./Observer.coffee');

Utility = require('./Utility.coffee');

Palette = require('./Palette.coffee');

Storage = require('./Storage.coffee');

Toolbar = require('./Toolbar.coffee');

Menu = require('./Menu.coffee');

Info = require('./Info.coffee');

SidePanel = require('./SidePanel.coffee');

Projector = require('./Projector.coffee');

DataProjector = (function(superClass) {
  extend(DataProjector, superClass);

  DataProjector.prototype.storage = null;

  DataProjector.prototype.toolbar = null;

  DataProjector.prototype.menu = null;

  DataProjector.prototype.info = null;

  DataProjector.prototype.sidepanel = null;

  DataProjector.prototype.projector = null;

  DataProjector.prototype.palette = null;

  DataProjector.prototype.colors = null;

  function DataProjector() {
    this.storage = new Storage();
    this.storage.attach(this);
    this.storage.requestData();
    this.toolbar = new Toolbar('#toolbar');
    this.toolbar.attach(this);
    this.menu = new Menu('#menu');
    this.menu.attach(this);
    this.info = new Info('#info');
    this.info.attach(this);
    this.sidepanel = new SidePanel('#sidebar-wrapper');
    this.sidepanel.attach(this);
    this.projector = new Projector();
    this.projector.attach(this);
  }

  DataProjector.prototype.update = function(subject, type, data) {
    if (subject instanceof Storage) {
      this.onStorageEvent(type, data);
    }
    if (subject instanceof Toolbar) {
      this.onToolbarEvent(type, data);
    }
    if (subject instanceof Menu) {
      this.onMenuEvent(type, data);
    }
    if (subject instanceof Projector) {
      return this.onProjectorEvent(type, data);
    }
  };

  DataProjector.prototype.onStorageEvent = function(type, data) {
    switch (type) {
      case Storage.EVENT_DATA_READY:
        this.info.display("Processed " + (this.storage.getPoints()) + " points.");
        this.info.display("Found " + (this.storage.getClusters()) + " clusters.");
        return this.initialize();
      case Storage.EVENT_SCREENSHOT_OK:
        return this.info.display("Screenshot " + (this.storage.getSaved()) + " saved.");
    }
  };

  DataProjector.prototype.onToolbarEvent = function(type, data) {
    var icon, spinning, state, visible;
    switch (type) {
      case Toolbar.EVENT_MENU:
        state = this.menu.toggle();
        return this.toolbar.setMenuButtonSelected(state);
      case Toolbar.EVENT_INFO:
        state = this.info.toggle();
        return this.toolbar.setInfoButtonSelected(state);
      case Toolbar.EVENT_PERSPECTIVE:
        this.projector.setMode(Projector.VIEW.PERSPECTIVE);
        return this.toolbar.setCameraButtonSelected(true, false, false);
      case Toolbar.EVENT_ORTHOGRAPHIC:
        this.projector.setMode(Projector.VIEW.ORTHOGRAPHIC);
        return this.toolbar.setCameraButtonSelected(false, true, false);
      case Toolbar.EVENT_DUAL:
        this.projector.setMode(Projector.VIEW.DUAL);
        return this.toolbar.setCameraButtonSelected(false, false, true);
      case Toolbar.EVENT_RESET:
        this.projector.resetCamera(true);
        return this.toolbar.blinkResetButton();
      case Toolbar.EVENT_CLEAR:
        this.info.clear();
        return this.toolbar.blinkClearButton();
      case Toolbar.EVENT_BOX:
        state = this.projector.toggleBox();
        return this.toolbar.setBoxButtonSelected(state);
      case Toolbar.EVENT_VIEWPORT:
        state = this.projector.toggleViewport();
        return this.toolbar.setViewportButtonSelected(state);
      case Toolbar.EVENT_SELECT:
        state = this.projector.toggleSelector();
        return this.toolbar.setSelectButtonSelected(state);
      case Toolbar.EVENT_VIEW_TOP:
        this.projector.changeView(Utility.DIRECTION.TOP);
        return this.toolbar.setViewButtonSelected(true, false, false);
      case Toolbar.EVENT_VIEW_FRONT:
        this.projector.changeView(Utility.DIRECTION.FRONT);
        return this.toolbar.setViewButtonSelected(false, true, false);
      case Toolbar.EVENT_VIEW_SIDE:
        this.projector.changeView(Utility.DIRECTION.SIDE);
        return this.toolbar.setViewButtonSelected(false, false, true);
      case Toolbar.EVENT_SPIN_LEFT:
        this.projector.setSpin(Projector.SPIN.LEFT);
        return this.toolbar.setSpinButtonSelected(true, false, false);
      case Toolbar.EVENT_SPIN_STOP:
        this.projector.setSpin(Projector.SPIN.NONE);
        return this.toolbar.setSpinButtonSelected(false, true, false);
      case Toolbar.EVENT_SPIN_RIGHT:
        this.projector.setSpin(Projector.SPIN.RIGHT);
        return this.toolbar.setSpinButtonSelected(false, false, true);
      case Toolbar.EVENT_ANIMATE:
        state = this.projector.toggleAnimation();
        return this.toolbar.setAnimateButtonSelected(state);
      case Toolbar.EVENT_SPIN_TOGGLE:
        spinning = !this.projector.spinOn;
        icon = function(style) {
          return $('#toggleSpinButton button i').attr('class', style);
        };
        if (spinning) {
          icon('fa fa-play');
        } else {
          icon('fa fa-pause');
        }
        return this.projector.toggleSpin();
      case Toolbar.EVENT_SHOW_DOCUMENTS:
        visible = this.projector.getVisibleDocuments();
        return this.sidepanel.displayDocumentsList(visible.documents);
      case Toolbar.EVENT_PRINT:
        this.storage.saveImage(this.projector.getImage());
        return this.toolbar.blinkPrintButton();
    }
  };

  DataProjector.prototype.onMenuEvent = function(type, data) {
    switch (type) {
      case Menu.EVENT_TOGGLE_ALL_ON:
        return this.projector.setAllClustersVisible(true);
      case Menu.EVENT_TOGGLE_ALL_OFF:
        return this.projector.setAllClustersVisible(false);
      case Menu.EVENT_TOGGLE_ID:
        return this.projector.toggleClusterVisibility(data.id);
      case Menu.EVENT_CLUSTER_ID:
        return this.projector.toggleClusterSelection(data.id);
    }
  };

  DataProjector.prototype.onProjectorEvent = function(type, data) {
    console.log("DataProjector.onProjectorEvent " + type + " : " + data);
    switch (type) {
      case Projector.EVENT_DATA_LOADED:
        return console.log("DataProjector.onProjectorEvent " + type);
      case Projector.EVENT_POINTS_SELECTED:
        return this.info.displayDocuments(data);
      case Projector.EVENT_CLUSTER_SELECTED:
        if (data.id > -1) {
          return this.info.display("Cluster " + data.id + " selected");
        } else {
          return this.info.display("No cluster selected");
        }
    }
  };

  DataProjector.prototype.initialize = function() {
    this.palette = new Palette(this.storage.getClusters());
    this.colors = this.palette.getColors();
    this.menu.create(this.storage.getClusters(), this.palette.getColors());
    this.projector.setColors(this.colors);
    this.projector.load(this.storage);
    return this.onToolbarEvent(Toolbar.EVENT_SPIN_RIGHT);
  };

  return DataProjector;

})(Observer);

dataProjector = new DataProjector();


},{"./Info.coffee":2,"./Menu.coffee":3,"./Observer.coffee":4,"./Palette.coffee":5,"./Projector.coffee":7,"./SidePanel.coffee":9,"./Storage.coffee":10,"./Subject.coffee":11,"./Toolbar.coffee":12,"./Utility.coffee":13}],2:[function(require,module,exports){
var Info, Panel,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Panel = require('./Panel.coffee');

Info = (function(superClass) {
  extend(Info, superClass);

  function Info(id) {
    Info.__super__.constructor.call(this, id);
  }

  Info.prototype.display = function(message) {
    return $('#message').append(message + "<br/>");
  };

  Info.prototype.displayDocuments = function(data) {
    var doc, docsHtml, documents, i, j, len, len1, title;
    this.clear();
    Array.prototype.shuffle = function() {
      return this.sort(function() {
        return 0.5 - Math.random();
      });
    };
    documents = data.documents.shuffle().slice(0, 46);
    len = 60;
    for (i = j = 0, len1 = documents.length; j < len1; i = ++j) {
      doc = documents[i];
      title = doc.title.substring(0, len);
      if (title.length === len) {
        title = title + '...';
      }
      documents[i].title = title;
    }
    docsHtml = ((function() {
      var k, len2, results;
      results = [];
      for (k = 0, len2 = documents.length; k < len2; k++) {
        doc = documents[k];
        results.push("<a data-toggle='modal' data-target='#myModal' data-doc-id='" + doc.id + "'>" + doc.title + "</a><br/>");
      }
      return results;
    })()).join('');
    return $('#message').append(docsHtml);
  };

  Info.prototype.clear = function() {
    return $('#message').text("");
  };

  return Info;

})(Panel);

module.exports = Info;


},{"./Panel.coffee":6}],3:[function(require,module,exports){
var Menu, Panel,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Panel = require('./Panel.coffee');

Menu = (function(superClass) {
  extend(Menu, superClass);

  Menu.EVENT_TOGGLE_ALL_ON = "EVENT_TOGGLE_ALL_ON";

  Menu.EVENT_TOGGLE_ALL_OFF = "EVENT_TOGGLE_ALL_OFF";

  Menu.EVENT_TOGGLE_ID = "EVENT_TOGGLE_ID";

  Menu.EVENT_CLUSTER_ID = "EVENT_CLUSTER_ID";

  Menu.TOGGLE_ON = true;

  Menu.TOGGLE_OFF = false;

  Menu.TOGGLE_MIX = false;

  Menu.prototype.clusters = 0;

  Menu.prototype.selected = -1;

  Menu.prototype.colors = null;

  Menu.prototype.allId = '#toggleAll';

  function Menu(id) {
    this.onCluster = bind(this.onCluster, this);
    this.onToggle = bind(this.onToggle, this);
    this.onToggleAll = bind(this.onToggleAll, this);
    Menu.__super__.constructor.call(this, id);
  }

  Menu.prototype.onToggleAll = function(event) {
    var i, j, k, ref, ref1, state, tag;
    state = this.getState(this.allId);
    switch (state) {
      case Menu.TOGGLE_ON:
        this.setState(this.allId, Menu.TOGGLE_ON);
        for (i = j = 0, ref = this.clusters; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
          tag = '#t' + String(i);
          this.setState(tag, Menu.TOGGLE_ON);
        }
        return this.notify(Menu.EVENT_TOGGLE_ALL_ON);
      case Menu.TOGGLE_OFF:
      case Menu.TOGGLE_MIX:
        this.setState(this.allId, Menu.TOGGLE_OFF);
        for (i = k = 0, ref1 = this.clusters; 0 <= ref1 ? k < ref1 : k > ref1; i = 0 <= ref1 ? ++k : --k) {
          tag = '#t' + String(i);
          this.setState(tag, Menu.TOGGLE_OFF);
        }
        return this.notify(Menu.EVENT_TOGGLE_ALL_OFF);
    }
  };

  Menu.prototype.onToggle = function(event) {
    var id, identifier, index;
    identifier = event.target.id;
    id = identifier.replace("t", "");
    index = parseInt(id);
    this.doToggle(index);
    return this.notify(Menu.EVENT_TOGGLE_ID, {
      id: index
    });
  };

  Menu.prototype.onCluster = function(event) {
    var index;
    index = parseInt(event.target.id.replace("b", ""));
    if (this.selected === index) {
      this.selected = -1;
    } else {
      this.selected = index;
    }
    this.updateSwatches();
    this.updateButtons();
    return this.notify(Menu.EVENT_CLUSTER_ID, {
      id: index
    });
  };

  Menu.prototype.doToggle = function(index) {
    var state, tag;
    tag = "#t" + String(index);
    state = this.getState(tag);
    switch (state) {
      case Menu.TOGGLE_OFF:
        this.setState(tag, Menu.TOGGLE_OFF);
        break;
      case Menu.TOGGLE_ON:
        this.setState(tag, Menu.TOGGLE_ON);
    }
    return this.updateMasterToggle();
  };

  Menu.prototype.create = function(clusters, colors) {
    var html, i, j, k, ref, ref1;
    this.clusters = clusters;
    this.colors = colors;
    for (i = j = 0, ref = this.clusters; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
      html = "<input type='checkbox' class='toggle' id='t" + i + "' checked><span class='button' id='b" + i + "'></span> <span class='color' id='c" + i + "'>Cluster " + i + " </span>";
      $("#menu").append(html);
    }
    $(this.allId).click(this.onToggleAll);
    for (i = k = 0, ref1 = this.clusters; 0 <= ref1 ? k < ref1 : k > ref1; i = 0 <= ref1 ? ++k : --k) {
      $("#t" + String(i)).click(this.onToggle);
      $("#b" + String(i)).click(this.onCluster);
    }
    return this.updateSwatches();
  };

  Menu.prototype.togglesOn = function() {
    var i, j, ref, result, state, tag;
    result = 0;
    for (i = j = 0, ref = this.clusters; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
      tag = "#t" + String(i);
      state = this.getState(tag);
      if (state === Menu.TOGGLE_ON) {
        result++;
      }
    }
    return result;
  };

  Menu.prototype.setState = function(tag, state) {
    return $(tag).prop('checked', state);
  };

  Menu.prototype.getState = function(tag) {
    return $(tag).prop('checked');
  };

  Menu.prototype.updateMasterToggle = function() {
    var shown;
    shown = this.togglesOn();
    switch (shown) {
      case 0:
        return this.setState(this.allId, Menu.TOGGLE_OFF);
      case this.clusters:
        return this.setState(this.allId, Menu.TOGGLE_ON);
      default:
        return this.setState(this.allId, Menu.TOGGLE_MIX);
    }
  };

  Menu.prototype.updateSwatches = function() {
    var i, j, ref, results;
    results = [];
    for (i = j = 0, ref = this.clusters; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
      if (i === this.selected) {
        results.push($("#c" + String(i)).css('color', Palette.HIGHLIGHT.getStyle()));
      } else {
        results.push($("#c" + String(i)).css('color', this.colors[i].getStyle()));
      }
    }
    return results;
  };

  Menu.prototype.updateButtons = function() {
    var i, j, ref, results;
    results = [];
    for (i = j = 0, ref = this.clusters; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
      if (i === this.selected) {
        results.push($("#b" + String(i)).css('color', Palette.HIGHLIGHT.getStyle()));
      } else {
        results.push($("#b" + String(i)).css('color', Palette.BUTTON.getStyle()));
      }
    }
    return results;
  };

  return Menu;

})(Panel);

module.exports = Menu;


},{"./Panel.coffee":6}],4:[function(require,module,exports){
var Observer;

Observer = (function() {
  function Observer() {}

  Observer.prototype.update = function(subject, type, data) {};

  return Observer;

})();

module.exports = Observer;


},{}],5:[function(require,module,exports){
var Palette;

Palette = (function() {
  Palette.BACKGROUND = new THREE.Color(0x202020);

  Palette.HIGHLIGHT = new THREE.Color(0xFFFFFF);

  Palette.SELECTOR = new THREE.Color(0xCC0000);

  Palette.BUTTON = new THREE.Color(0xCCCCCC);

  Palette.BUTTON_SELECTED = new THREE.Color(0xFF9C00);

  Palette.prototype.colors = null;

  function Palette(size) {
    this.colors = new Array();
    this.generate(size);
  }

  Palette.prototype.generate = function(size) {
    var color, hue, i, j, lightness, ref, results, saturation, step;
    hue = 0;
    saturation = 0.7;
    lightness = 0.45;
    step = 1 / size;
    results = [];
    for (i = j = 0, ref = size; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
      hue = (i + 1) * step;
      color = new THREE.Color();
      color.setHSL(hue, saturation, lightness);
      results.push(this.colors.push(color));
    }
    return results;
  };

  Palette.prototype.getColors = function() {
    return this.colors;
  };

  Palette.prototype.print = function() {
    var c, css, hsl, hue, i, j, len, lightness, ref, results, saturation;
    i = 0;
    ref = this.colors;
    results = [];
    for (j = 0, len = ref.length; j < len; j++) {
      c = ref[j];
      css = c.getStyle();
      hsl = c.getHSL();
      hue = hsl.h.toFixed(1);
      saturation = hsl.s.toFixed(1);
      lightness = hsl.l.toFixed(1);
      results.push(console.log(i++ + " > " + hue + " : " + saturation + " : " + lightness + " | " + css));
    }
    return results;
  };

  return Palette;

})();

module.exports = Palette;


},{}],6:[function(require,module,exports){
var Panel, Subject,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Subject = require('./Subject.coffee');

Panel = (function(superClass) {
  extend(Panel, superClass);

  Panel.EVENT_PANEL_SHOWN = "EVENT_PANEL_SHOWN";

  Panel.EVENT_PANEL_HIDDEN = "EVENT_PANEL_HIDDEN";

  Panel.prototype.visible = true;

  function Panel(id) {
    this.id = id;
    Panel.__super__.constructor.call(this);
  }

  Panel.prototype.show = function() {
    $(this.id).show();
    this.visible = true;
    return this.notify(Panel.EVENT_PANEL_SHOWN);
  };

  Panel.prototype.hide = function() {
    $(this.id).hide();
    this.visible = false;
    return this.notify(Panel.EVENT_PANEL_HIDDEN);
  };

  Panel.prototype.toggle = function() {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
    return this.visible;
  };

  return Panel;

})(Subject);

module.exports = Panel;


},{"./Subject.coffee":11}],7:[function(require,module,exports){
var Palette, Projector, Selector, Subject, Utility,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Subject = require('./Subject.coffee');

Utility = require('./Utility.coffee');

Palette = require('./Palette.coffee');

Selector = require('./Selector.coffee');

Projector = (function(superClass) {
  extend(Projector, superClass);

  Projector.EVENT_DATA_LOADED = "EVENT_DATA_LOADED";

  Projector.EVENT_POINTS_SELECTED = "EVENT_POINTS_SELECTED";

  Projector.EVENT_CLUSTER_SELECTED = "EVENT_CLUSTER_SELECTED";

  Projector.VIEW = {
    NONE: -1,
    PERSPECTIVE: 0,
    ORTHOGRAPHIC: 1,
    DUAL: 2
  };

  Projector.SPIN = {
    LEFT: -1,
    NONE: 0,
    RIGHT: +1
  };

  Projector.SPIN_STEP = Utility.DEGREE / 10;

  Projector.prototype.SCREEN_WIDTH = window.innerWidth - $('#sidebar-wrapper').width();

  Projector.prototype.SCREEN_HEIGHT = window.innerHeight;

  Projector.prototype.mode = Projector.VIEW.PERSPECTIVE;

  Projector.prototype.storage = null;

  Projector.prototype.colors = null;

  Projector.prototype.scene = null;

  Projector.prototype.cameraPerspective = null;

  Projector.prototype.cameraOrthographic = null;

  Projector.prototype.renderer = null;

  Projector.prototype.mouse = new THREE.Vector3();

  Projector.prototype.mouseStart = new THREE.Vector3();

  Projector.prototype.mouseEnd = new THREE.Vector3();

  Projector.prototype.dragging = false;

  Projector.prototype.selector = null;

  Projector.prototype.box = null;

  Projector.prototype.viewport = null;

  Projector.prototype.direction = Utility.DIRECTION.TOP;

  Projector.prototype.view1 = null;

  Projector.prototype.view2 = null;

  Projector.prototype.view3 = null;

  Projector.prototype.points = null;

  Projector.prototype.particles = null;

  Projector.prototype.clusters = null;

  Projector.prototype.selected = -1;

  Projector.prototype.controls = null;

  Projector.prototype.timeStamp = 0;

  function Projector() {
    this.clustersVisible = bind(this.clustersVisible, this);
    this.startTimer = bind(this.startTimer, this);
    this.updatePoints = bind(this.updatePoints, this);
    this.toggleClusterSelection = bind(this.toggleClusterSelection, this);
    this.setAllClustersVisible = bind(this.setAllClustersVisible, this);
    this.toggleClusterVisibility = bind(this.toggleClusterVisibility, this);
    this.getSpinStep = bind(this.getSpinStep, this);
    this.spinCamera = bind(this.spinCamera, this);
    this.setSpin = bind(this.setSpin, this);
    this.toggleSpin = bind(this.toggleSpin, this);
    this.toggleAnimation = bind(this.toggleAnimation, this);
    this.changeView = bind(this.changeView, this);
    this.setViewsVisible = bind(this.setViewsVisible, this);
    this.updateView = bind(this.updateView, this);
    this.resetCamera = bind(this.resetCamera, this);
    this.updateMouse3D = bind(this.updateMouse3D, this);
    this.updateSelection = bind(this.updateSelection, this);
    this.getVisibleDocuments = bind(this.getVisibleDocuments, this);
    this.render = bind(this.render, this);
    this.animate = bind(this.animate, this);
    this.processPoint = bind(this.processPoint, this);
    this.load = bind(this.load, this);
    this.createRenderingEngine = bind(this.createRenderingEngine, this);
    this.createViews = bind(this.createViews, this);
    this.createBox = bind(this.createBox, this);
    this.createControls = bind(this.createControls, this);
    this.createOrthographicCamera = bind(this.createOrthographicCamera, this);
    this.createPerspectiveCamera = bind(this.createPerspectiveCamera, this);
    this.addUIListeners = bind(this.addUIListeners, this);
    this.getImage = bind(this.getImage, this);
    this.toggleSelector = bind(this.toggleSelector, this);
    this.toggleViewport = bind(this.toggleViewport, this);
    this.toggleBox = bind(this.toggleBox, this);
    this.setColors = bind(this.setColors, this);
    this.setMode = bind(this.setMode, this);
    this.onTimer = bind(this.onTimer, this);
    this.onMouseUp = bind(this.onMouseUp, this);
    this.onMouseMove = bind(this.onMouseMove, this);
    this.onMouseDown = bind(this.onMouseDown, this);
    this.onWindowResize = bind(this.onWindowResize, this);
    Projector.__super__.constructor.call(this);
    this.addUIListeners();
    this.scene = new THREE.Scene();
    this.createPerspectiveCamera();
    this.createOrthographicCamera();
    this.createControls();
    this.createBox();
    this.cameraPerspective.lookAt(this.box.position);
    this.cameraOrthographic.lookAt(this.box.position);
    this.createViews();
    this.updateView(true);
    this.setViewsVisible(false, false, false);
    this.selector = new Selector(this.box);
    this.createRenderingEngine();
    this.onWindowResize(null);
    this.animate();
  }

  $('.btn-toggle').click(function() {
    if ($(this).find('.btn-primary').size() > 0) {
      $(this).find('.btn').toggleClass('btn-primary');
    }
    return $(this).find('.btn').toggleClass('btn-default');
  });

  Projector.prototype.onWindowResize = function(event) {
    this.SCREEN_WIDTH = window.innerWidth - $('#sidebar-wrapper').width();
    this.SCREEN_HEIGHT = window.innerHeight;
    console.log("Screen " + this.SCREEN_WIDTH + " x " + this.SCREEN_HEIGHT);
    if (this.renderer != null) {
      this.renderer.setSize(this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
      switch (this.mode) {
        case Projector.VIEW.PERSPECTIVE:
          this.cameraPerspective.aspect = this.SCREEN_WIDTH / this.SCREEN_HEIGHT;
          this.cameraPerspective.updateProjectionMatrix();
          break;
        case Projector.VIEW.ORTHOGRAPHIC:
          this.cameraOrthographic.left = -(this.SCREEN_WIDTH / 8);
          this.cameraOrthographic.right = +(this.SCREEN_WIDTH / 8);
          this.cameraOrthographic.top = +(this.SCREEN_HEIGHT / 8);
          this.cameraOrthographic.bottom = -(this.SCREEN_HEIGHT / 8);
          this.cameraOrthographic.updateProjectionMatrix();
          break;
        case Projector.VIEW.DUAL:
          this.cameraPerspective.aspect = 0.5 * this.SCREEN_WIDTH / this.SCREEN_HEIGHT;
          this.cameraPerspective.updateProjectionMatrix();
          this.cameraOrthographic.left = -(this.SCREEN_WIDTH / 10);
          this.cameraOrthographic.right = +(this.SCREEN_WIDTH / 10);
          this.cameraOrthographic.top = +(this.SCREEN_HEIGHT / 5);
          this.cameraOrthographic.bottom = -(this.SCREEN_HEIGHT / 5);
          this.cameraOrthographic.updateProjectionMatrix();
      }
    }
    return this.controls.handleResize();
  };

  Projector.prototype.onMouseDown = function(event) {
    if (this.mode === Projector.VIEW.DUAL) {
      event.preventDefault();
      if (event.shiftKey) {
        this.dragging = true;
        this.updateMouse3D();
        this.mouseStart.copy(this.mouse);
        this.selector.start(this.mouseStart.clone());
        return event.stopPropagation();
      }
    }
  };

  Projector.prototype.onMouseMove = function(event) {
    if (this.mode === Projector.VIEW.DUAL) {
      event.preventDefault();
      if (this.dragging) {
        this.updateMouse3D();
        this.selector.update(this.mouse);
        return event.stopPropagation();
      }
    }
  };

  Projector.prototype.onMouseUp = function(event) {
    if (this.mode === Projector.VIEW.DUAL) {
      event.preventDefault();
      if (this.dragging) {
        this.dragging = false;
        this.updateMouse3D();
        this.mouseEnd.copy(this.mouse);
        this.selector.end(this.mouseEnd.clone());
        this.updateSelection();
        return event.stopPropagation();
      }
    }
  };

  Projector.prototype.onTimer = function(index) {
    this.toggleClusterVisibility(index);
    if (++index === this.storage.getClusters()) {
      index = 0;
    }
    if (this.animateOn) {
      return this.startTimer(index);
    }
  };

  Projector.prototype.setMode = function(mode) {
    this.mode = mode;
    return this.onWindowResize(null);
  };

  Projector.prototype.setColors = function(colors) {
    this.colors = colors;
  };

  Projector.prototype.toggleBox = function() {
    return (this.box.visible = !this.box.visible);
  };

  Projector.prototype.toggleViewport = function() {
    return this.updateView(!this.viewport.visible);
  };

  Projector.prototype.toggleSelector = function() {
    var state;
    state = this.selector.toggle();
    this.updateSelection();
    return state;
  };

  Projector.prototype.getImage = function() {
    return document.getElementById("renderer").toDataURL("image/png");
  };

  Projector.prototype.addUIListeners = function() {
    window.addEventListener('resize', this.onWindowResize, false);
    $('#container').mousedown(this.onMouseDown);
    $('#container').mousemove(this.onMouseMove);
    return $('#container').mouseup(this.onMouseUp);
  };

  Projector.prototype.createPerspectiveCamera = function() {
    this.cameraPerspective = new THREE.PerspectiveCamera(50, 0.5 * this.SCREEN_WIDTH / this.SCREEN_HEIGHT, 150, 1000);
    this.cameraPerspective.position.set(0, 0, 550);
    return this.scene.add(this.cameraPerspective);
  };

  Projector.prototype.createOrthographicCamera = function() {
    this.cameraOrthographic = new THREE.OrthographicCamera(-(this.SCREEN_WIDTH / 8), +(this.SCREEN_WIDTH / 8), +(this.SCREEN_HEIGHT / 4), -(this.SCREEN_HEIGHT / 4), 250, 750);
    this.cameraOrthographic.position.set(0, 500, 0);
    return this.scene.add(this.cameraOrthographic);
  };

  Projector.prototype.createControls = function() {
    this.controls = new THREE.TrackballControls(this.cameraPerspective);
    this.controls.rotateSpeed = 1.0;
    this.controls.zoomSpeed = 1.0;
    this.controls.panSpeed = 0.8;
    this.controls.noZoom = false;
    this.controls.noPan = false;
    this.controls.staticMoving = true;
    this.controls.dynamicDampingFactor = 0.3;
    return this.controls.addEventListener('change', this.render);
  };

  Projector.prototype.createBox = function() {
    this.box = new THREE.Mesh(new THREE.CubeGeometry(200, 200, 200), new THREE.MeshBasicMaterial({
      color: 0x404040,
      wireframe: true
    }));
    return this.scene.add(this.box);
  };

  Projector.prototype.createViews = function() {
    var geometry1, geometry2, geometry3;
    this.viewport = new THREE.Object3D();
    geometry1 = new THREE.Geometry();
    geometry1.vertices.push(new THREE.Vector3(+100, +101, +100));
    geometry1.vertices.push(new THREE.Vector3(-100, +101, +100));
    geometry1.vertices.push(new THREE.Vector3(-100, +101, -100));
    geometry1.vertices.push(new THREE.Vector3(+100, +101, -100));
    geometry1.vertices.push(new THREE.Vector3(+100, +101, +100));
    this.view1 = new THREE.Line(geometry1, new THREE.LineBasicMaterial(), THREE.LineStrip);
    geometry2 = new THREE.Geometry();
    geometry2.vertices.push(new THREE.Vector3(+100, +100, +101));
    geometry2.vertices.push(new THREE.Vector3(-100, +100, +101));
    geometry2.vertices.push(new THREE.Vector3(-100, -100, +101));
    geometry2.vertices.push(new THREE.Vector3(+100, -100, +101));
    geometry2.vertices.push(new THREE.Vector3(+100, +100, +101));
    this.view2 = new THREE.Line(geometry2, new THREE.LineBasicMaterial(), THREE.LineStrip);
    geometry3 = new THREE.Geometry();
    geometry3.vertices.push(new THREE.Vector3(+101, +100, +100));
    geometry3.vertices.push(new THREE.Vector3(+101, -100, +100));
    geometry3.vertices.push(new THREE.Vector3(+101, -100, -100));
    geometry3.vertices.push(new THREE.Vector3(+101, +100, -100));
    geometry3.vertices.push(new THREE.Vector3(+101, +100, +100));
    this.view3 = new THREE.Line(geometry3, new THREE.LineBasicMaterial(), THREE.LineStrip);
    this.viewport.add(this.view1);
    this.viewport.add(this.view2);
    this.viewport.add(this.view3);
    return this.box.add(this.viewport);
  };

  Projector.prototype.createRenderingEngine = function() {
    var container;
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
    this.renderer.setClearColor(Palette.BACKGROUND.getHex(), 1);
    this.renderer.domElement.style.position = "relative";
    this.renderer.domElement.id = "renderer";
    this.renderer.autoClear = false;
    container = $('#container').get(0);
    return container.appendChild(this.renderer.domElement);
  };

  Projector.prototype.load = function(storage) {
    var c, clusters, data, k, l, material, p, ref, ref1;
    this.storage = storage;
    data = this.storage.getData();
    clusters = this.storage.getClusters();
    this.points = new Array();
    for (c = k = 0, ref = clusters; 0 <= ref ? k < ref : k > ref; c = 0 <= ref ? ++k : --k) {
      this.points[c] = new THREE.Geometry();
      this.points[c].colorsNeedUpdate = true;
      this.points[c].documents = new Array();
    }
    $.each(data.points, this.processPoint);
    this.particles = new Array();
    for (p = l = 0, ref1 = clusters; 0 <= ref1 ? l < ref1 : l > ref1; p = 0 <= ref1 ? ++l : --l) {
      material = new THREE.ParticleBasicMaterial({
        size: 2.0,
        sizeAttenuation: false,
        vertexColors: true
      });
      this.particles[p] = new THREE.ParticleSystem(this.points[p], material);
      this.box.add(this.particles[p]);
    }
    return this.notify(Projector.EVENT_DATA_LOADED);
  };

  Projector.prototype.processPoint = function(nodeName, nodeData) {
    var color, index, vertex;
    index = parseInt(nodeData.cid);
    vertex = new THREE.Vector3();
    vertex.x = parseFloat(nodeData.x);
    vertex.y = parseFloat(nodeData.y);
    vertex.z = parseFloat(nodeData.z);
    this.points[index].vertices.push(vertex);
    color = this.colors[index].clone();
    this.points[index].colors.push(color);
    return this.points[index].documents.push(nodeData.document);
  };

  Projector.prototype.animate = function() {
    requestAnimationFrame(this.animate);
    this.controls.update();
    return this.render();
  };

  Projector.prototype.render = function() {
    this.renderer.clear();
    switch (this.mode) {
      case Projector.VIEW.PERSPECTIVE:
        if (this.spin !== Projector.SPIN.NONE) {
          this.spinCamera();
        }
        this.cameraPerspective.lookAt(this.box.position);
        this.renderer.setViewport(0, 0, this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
        return this.renderer.render(this.scene, this.cameraPerspective);
      case Projector.VIEW.ORTHOGRAPHIC:
        this.cameraOrthographic.rotation.z = 0;
        this.renderer.setViewport(0, 0, this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
        return this.renderer.render(this.scene, this.cameraOrthographic);
      case Projector.VIEW.DUAL:
        if (this.spin !== Projector.SPIN.NONE) {
          this.spinCamera();
        }
        this.cameraPerspective.lookAt(this.box.position);
        this.renderer.setViewport(0, 0, this.SCREEN_WIDTH / 2, this.SCREEN_HEIGHT);
        this.renderer.render(this.scene, this.cameraPerspective);
        this.cameraOrthographic.rotation.z = 0;
        this.renderer.setViewport(this.SCREEN_WIDTH / 2, 0, this.SCREEN_WIDTH / 2, this.SCREEN_HEIGHT);
        return this.renderer.render(this.scene, this.cameraOrthographic);
    }
  };

  Projector.prototype.getVisibleDocuments = function() {
    var all, cloud, document, documents, i, j, k, l, ref, ref1, vertex;
    documents = new Array();
    for (i = k = 0, ref = this.storage.getClusters(); 0 <= ref ? k < ref : k > ref; i = 0 <= ref ? ++k : --k) {
      if (this.particles[i].visible) {
        cloud = this.points[i];
        all = cloud.vertices.length;
        for (j = l = 0, ref1 = all; 0 <= ref1 ? l < ref1 : l > ref1; j = 0 <= ref1 ? ++l : --l) {
          vertex = cloud.vertices[j];
          document = cloud.documents[j];
          if (!this.selector.isActive()) {
            documents.push(document);
          }
          if (this.selector.isActive() && this.selector.contains(vertex, Utility.DIRECTION.ALL)) {
            documents.push(document);
          }
        }
        cloud.colorsNeedUpdate = true;
      }
    }
    return {
      documents: documents
    };
  };

  Projector.prototype.updateSelection = function() {
    var all, cloud, color, counter, document, documents, i, j, k, l, ref, ref1, vertex;
    counter = 0;
    documents = new Array();
    for (i = k = 0, ref = this.storage.getClusters(); 0 <= ref ? k < ref : k > ref; i = 0 <= ref ? ++k : --k) {
      if (this.particles[i].visible) {
        cloud = this.points[i];
        all = cloud.vertices.length;
        for (j = l = 0, ref1 = all; 0 <= ref1 ? l < ref1 : l > ref1; j = 0 <= ref1 ? ++l : --l) {
          vertex = cloud.vertices[j];
          color = cloud.colors[j];
          document = cloud.documents[j];
          if (!this.selector.isActive()) {
            documents.push(document);
          }
          if (this.selector.isActive() && this.selector.contains(vertex, Utility.DIRECTION.ALL)) {
            color.setHex(Palette.HIGHLIGHT.getHex());
            counter++;
            documents.push(document);
          } else {
            color.setHex(this.colors[i].getHex());
          }
        }
        cloud.colorsNeedUpdate = true;
      }
    }
    return this.notify(Projector.EVENT_POINTS_SELECTED, {
      documents: documents,
      points: counter
    });
  };

  Projector.prototype.updateMouse3D = function() {
    var ratio;
    ratio = 100 / 250;
    switch (this.direction) {
      case Utility.DIRECTION.TOP:
        this.mouse.x = (event.pageX - (3 * this.SCREEN_WIDTH / 4)) * ratio;
        this.mouse.y = 100;
        return this.mouse.z = (event.pageY - (this.SCREEN_HEIGHT / 2)) * ratio;
      case Utility.DIRECTION.FRONT:
        this.mouse.x = (event.pageX - (3 * this.SCREEN_WIDTH / 4)) * ratio;
        this.mouse.y = -(event.pageY - (this.SCREEN_HEIGHT / 2)) * ratio;
        return this.mouse.z = 100;
      case Utility.DIRECTION.SIDE:
        this.mouse.x = 100;
        this.mouse.y = -(event.pageY - (this.SCREEN_HEIGHT / 2)) * ratio;
        return this.mouse.z = -(event.pageX - (3 * this.SCREEN_WIDTH / 4)) * ratio;
    }
  };

  Projector.prototype.resetCamera = function(location) {
    if (location) {
      TweenLite.to(this.cameraPerspective.position, 1, {
        x: 0,
        y: 0,
        z: 550
      });
    }
    TweenLite.to(this.cameraPerspective.rotation, 1, {
      x: 0,
      y: 0,
      z: 0
    });
    return TweenLite.to(this.cameraPerspective.up, 1, {
      x: 0,
      y: 1,
      z: 0
    });
  };

  Projector.prototype.updateView = function(visible) {
    this.viewport.visible = visible;
    if (this.viewport.visible) {
      switch (this.direction) {
        case Utility.DIRECTION.TOP:
          this.setViewsVisible(true, false, false);
          this.cameraOrthographic.position.set(0, 500, 0);
          break;
        case Utility.DIRECTION.FRONT:
          this.setViewsVisible(false, true, false);
          this.cameraOrthographic.position.set(0, 0, 500);
          break;
        case Utility.DIRECTION.SIDE:
          this.setViewsVisible(false, false, true);
          this.cameraOrthographic.position.set(500, 0, 0);
      }
      this.cameraOrthographic.lookAt(this.box.position);
    } else {
      this.setViewsVisible(false, false, false);
    }
    return this.viewport.visible;
  };

  Projector.prototype.setViewsVisible = function(top, front, side) {
    this.view1.visible = top;
    this.view2.visible = front;
    return this.view3.visible = side;
  };

  Projector.prototype.changeView = function(direction) {
    this.direction = direction;
    this.updateView(this.viewport.visible);
    return this.selector.setDirection(this.direction);
  };

  Projector.prototype.toggleAnimation = function() {
    this.animateOn = !this.animateOn;
    if (this.animateOn) {
      this.setAllClustersVisible(false);
      this.startTimer(0);
    } else {
      this.setAllClustersVisible(true);
    }
    return this.animateOn;
  };

  Projector.prototype.toggleSpin = function() {
    if (this.spinOn) {
      this.setSpin(Projector.SPIN.RIGHT);
    } else {
      this.setSpin(Projector.SPIN.NONE);
    }
    return this.spinOn = !this.spinOn;
  };

  Projector.prototype.setSpin = function(spin) {
    this.spin = spin;
    switch (this.spin) {
      case Projector.SPIN.LEFT:
        return this.resetCamera(false);
      case Projector.SPIN.NONE:
        return this.timeStamp = 0;
      case Projector.SPIN.RIGHT:
        return this.resetCamera(false);
    }
  };

  Projector.prototype.spinCamera = function() {
    var STEP, cx, cy, radians, radius, x, y;
    STEP = this.getSpinStep();
    cx = this.cameraPerspective.position.x;
    cy = -1 * this.cameraPerspective.position.z;
    radians = Math.atan2(cy, cx);
    radius = Math.sqrt(cx * cx + cy * cy);
    switch (this.spin) {
      case Projector.SPIN.LEFT:
        radians += STEP;
        if (radians > Math.PI) {
          radians = radians - (2 * Math.PI);
        }
        break;
      case Projector.SPIN.RIGHT:
        radians -= STEP;
        if (radians < -Math.PI) {
          radians = (2 * Math.PI) + radians;
        }
    }
    x = radius * Math.cos(radians);
    y = radius * Math.sin(radians);
    this.cameraPerspective.position.x = x;
    return this.cameraPerspective.position.z = -1 * y;
  };

  Projector.prototype.getSpinStep = function() {
    var date, delta, step, timeNow;
    step = Projector.SPIN_STEP;
    if (this.timeStamp !== 0) {
      date = new Date();
      timeNow = date.getTime();
      delta = timeNow - this.timeStamp;
      this.timeStamp = timeNow;
      step = delta * step / 10;
    }
    return step;
  };

  Projector.prototype.toggleClusterVisibility = function(index) {
    return this.particles[index].visible = !this.particles[index].visible;
  };

  Projector.prototype.setAllClustersVisible = function(visible) {
    var k, len, p, ref, results;
    ref = this.particles;
    results = [];
    for (k = 0, len = ref.length; k < len; k++) {
      p = ref[k];
      results.push(p.visible = visible);
    }
    return results;
  };

  Projector.prototype.toggleClusterSelection = function(index) {
    var hexColor;
    if (this.selected > -1) {
      hexColor = this.colors[this.selected].getHex();
      this.updatePoints(this.selected, hexColor);
    }
    if (this.selected === index) {
      this.selected = -1;
    } else {
      this.selected = index;
      this.updatePoints(this.selected, Palette.HIGHLIGHT.getHex());
    }
    if (this.selected > -1) {
      return this.notify(Projector.EVENT_CLUSTER_SELECTED, {
        id: index
      });
    } else {
      return this.notify(Projector.EVENT_CLUSTER_SELECTED, {
        id: -1
      });
    }
  };

  Projector.prototype.updatePoints = function(index, color) {
    var all, cloud, i, k, ref;
    cloud = this.points[index];
    all = cloud.vertices.length;
    for (i = k = 0, ref = all; 0 <= ref ? k < ref : k > ref; i = 0 <= ref ? ++k : --k) {
      cloud.colors[i].setHex(color);
    }
    return this.points[index].colorsNeedUpdate = true;
  };

  Projector.prototype.startTimer = function(index) {
    this.toggleClusterVisibility(index);
    return window.setTimeout(this.onTimer, 2 * Utility.SECOND, index);
  };

  Projector.prototype.clustersVisible = function() {
    var cloud, k, len, ref, result;
    result = 0;
    ref = this.particles;
    for (k = 0, len = ref.length; k < len; k++) {
      cloud = ref[k];
      if (cloud.visible) {
        result++;
      }
    }
    return result;
  };

  return Projector;

})(Subject);

module.exports = Projector;


},{"./Palette.coffee":5,"./Selector.coffee":8,"./Subject.coffee":11,"./Utility.coffee":13}],8:[function(require,module,exports){
var Palette, Selector, Utility,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

Utility = require('./Utility.coffee');

Palette = require('./Palette.coffee');

Selector = (function() {
  Selector.prototype.active = false;

  Selector.prototype.direction = Utility.DIRECTION.TOP;

  Selector.prototype.selectorTop = null;

  Selector.prototype.selectorFront = null;

  Selector.prototype.selectorSide = null;

  Selector.prototype.mouseStart = null;

  Selector.prototype.mouse = null;

  Selector.prototype.mouseEnd = null;

  Selector.prototype.min = null;

  Selector.prototype.max = null;

  function Selector(parent) {
    this.toggle = bind(this.toggle, this);
    this.isActive = bind(this.isActive, this);
    this.mouseStart = new THREE.Vector3();
    this.mouse = new THREE.Vector3();
    this.mouseEnd = new THREE.Vector3();
    this.min = new THREE.Vector3();
    this.max = new THREE.Vector3();
    this.selectorTop = this.createSelector(Utility.DIRECTION.TOP);
    parent.add(this.selectorTop);
    this.selectorFront = this.createSelector(Utility.DIRECTION.FRONT);
    parent.add(this.selectorFront);
    this.selectorSide = this.createSelector(Utility.DIRECTION.SIDE);
    parent.add(this.selectorSide);
    this.setActive(false);
  }

  Selector.prototype.setActive = function(active) {
    this.active = active;
    this.selectorTop.visible = this.active;
    this.selectorFront.visible = this.active;
    this.selectorSide.visible = this.active;
    return this.active;
  };

  Selector.prototype.setDirection = function(direction1) {
    this.direction = direction1;
    return console.log("Selector.setDirection " + this.direction);
  };

  Selector.prototype.isActive = function() {
    return this.active;
  };

  Selector.prototype.toggle = function() {
    return this.setActive(!this.active);
  };

  Selector.prototype.start = function(mouse1) {
    this.mouse = mouse1;
    this.setActive(true);
    if (!this.contains(mouse, this.direction)) {
      return this.mouseStart = mouse;
    } else {
      switch (this.direction) {
        case Utility.DIRECTION.TOP:
          return this.mouseStart = this.getStart(mouse, this.selectorTop);
        case Utility.DIRECTION.FRONT:
          return this.mouseStart = this.getStart(mouse, this.selectorFront);
        case Utility.DIRECTION.SIDE:
          return this.mouseStart = this.getStart(mouse, this.selectorSide);
      }
    }
  };

  Selector.prototype.getStart = function(mouse, selector) {
    var distanceTo0, distanceTo1, distanceTo2, distanceTo3, shortest, start;
    distanceTo0 = mouse.distanceTo(selector.geometry.vertices[0]);
    distanceTo1 = mouse.distanceTo(selector.geometry.vertices[1]);
    distanceTo2 = mouse.distanceTo(selector.geometry.vertices[2]);
    distanceTo3 = mouse.distanceTo(selector.geometry.vertices[3]);
    shortest = Math.min(distanceTo0, distanceTo1, distanceTo2, distanceTo3);
    if (shortest === distanceTo0) {
      start = selector.geometry.vertices[2].clone();
    }
    if (shortest === distanceTo1) {
      start = selector.geometry.vertices[3].clone();
    }
    if (shortest === distanceTo2) {
      start = selector.geometry.vertices[0].clone();
    }
    if (shortest === distanceTo3) {
      start = selector.geometry.vertices[1].clone();
    }
    return start;
  };

  Selector.prototype.update = function(mouse1) {
    this.mouse = mouse1;
    switch (this.direction) {
      case Utility.DIRECTION.TOP:
        this.selectorTop.geometry.vertices[0].x = this.mouseStart.x;
        this.selectorTop.geometry.vertices[0].y = 100;
        this.selectorTop.geometry.vertices[0].z = this.mouseStart.z;
        this.selectorTop.geometry.vertices[1].x = this.mouse.x;
        this.selectorTop.geometry.vertices[1].y = 100;
        this.selectorTop.geometry.vertices[1].z = this.mouseStart.z;
        this.selectorTop.geometry.vertices[2].x = this.mouse.x;
        this.selectorTop.geometry.vertices[2].y = 100;
        this.selectorTop.geometry.vertices[2].z = this.mouse.z;
        this.selectorTop.geometry.vertices[3].x = this.mouseStart.x;
        this.selectorTop.geometry.vertices[3].y = 100;
        this.selectorTop.geometry.vertices[3].z = this.mouse.z;
        this.selectorTop.geometry.vertices[4].x = this.mouseStart.x;
        this.selectorTop.geometry.vertices[4].y = 100;
        this.selectorTop.geometry.vertices[4].z = this.mouseStart.z;
        this.selectorFront.geometry.vertices[0].x = this.mouseStart.x;
        this.selectorFront.geometry.vertices[0].z = 100;
        this.selectorFront.geometry.vertices[1].x = this.mouse.x;
        this.selectorFront.geometry.vertices[1].z = 100;
        this.selectorFront.geometry.vertices[2].x = this.mouse.x;
        this.selectorFront.geometry.vertices[2].z = 100;
        this.selectorFront.geometry.vertices[3].x = this.mouseStart.x;
        this.selectorFront.geometry.vertices[3].z = 100;
        this.selectorFront.geometry.vertices[4].x = this.mouseStart.x;
        this.selectorFront.geometry.vertices[4].z = 100;
        this.selectorSide.geometry.vertices[0].x = 100;
        this.selectorSide.geometry.vertices[0].z = this.mouseStart.z;
        this.selectorSide.geometry.vertices[1].x = 100;
        this.selectorSide.geometry.vertices[1].z = this.mouseStart.z;
        this.selectorSide.geometry.vertices[2].x = 100;
        this.selectorSide.geometry.vertices[2].z = this.mouse.z;
        this.selectorSide.geometry.vertices[3].x = 100;
        this.selectorSide.geometry.vertices[3].z = this.mouse.z;
        this.selectorSide.geometry.vertices[4].x = 100;
        this.selectorSide.geometry.vertices[4].z = this.mouseStart.z;
        break;
      case Utility.DIRECTION.FRONT:
        this.selectorFront.geometry.vertices[0].x = this.mouseStart.x;
        this.selectorFront.geometry.vertices[0].y = this.mouseStart.y;
        this.selectorFront.geometry.vertices[0].z = 100;
        this.selectorFront.geometry.vertices[1].x = this.mouse.x;
        this.selectorFront.geometry.vertices[1].y = this.mouseStart.y;
        this.selectorFront.geometry.vertices[1].z = 100;
        this.selectorFront.geometry.vertices[2].x = this.mouse.x;
        this.selectorFront.geometry.vertices[2].y = this.mouse.y;
        this.selectorFront.geometry.vertices[2].z = 100;
        this.selectorFront.geometry.vertices[3].x = this.mouseStart.x;
        this.selectorFront.geometry.vertices[3].y = this.mouse.y;
        this.selectorFront.geometry.vertices[3].z = 100;
        this.selectorFront.geometry.vertices[4].x = this.mouseStart.x;
        this.selectorFront.geometry.vertices[4].y = this.mouseStart.y;
        this.selectorFront.geometry.vertices[4].z = 100;
        this.selectorTop.geometry.vertices[0].x = this.mouseStart.x;
        this.selectorTop.geometry.vertices[0].y = 100;
        this.selectorTop.geometry.vertices[1].x = this.mouse.x;
        this.selectorTop.geometry.vertices[1].y = 100;
        this.selectorTop.geometry.vertices[2].x = this.mouse.x;
        this.selectorTop.geometry.vertices[2].y = 100;
        this.selectorTop.geometry.vertices[3].x = this.mouseStart.x;
        this.selectorTop.geometry.vertices[3].y = 100;
        this.selectorTop.geometry.vertices[4].x = this.mouseStart.x;
        this.selectorTop.geometry.vertices[4].y = 100;
        this.selectorSide.geometry.vertices[0].x = 100;
        this.selectorSide.geometry.vertices[0].y = this.mouseStart.y;
        this.selectorSide.geometry.vertices[1].x = 100;
        this.selectorSide.geometry.vertices[1].y = this.mouse.y;
        this.selectorSide.geometry.vertices[2].x = 100;
        this.selectorSide.geometry.vertices[2].y = this.mouse.y;
        this.selectorSide.geometry.vertices[3].x = 100;
        this.selectorSide.geometry.vertices[3].y = this.mouseStart.y;
        this.selectorSide.geometry.vertices[4].x = 100;
        this.selectorSide.geometry.vertices[4].y = this.mouseStart.y;
        break;
      case Utility.DIRECTION.SIDE:
        this.selectorSide.geometry.vertices[0].x = 100;
        this.selectorSide.geometry.vertices[0].y = this.mouseStart.y;
        this.selectorSide.geometry.vertices[0].z = this.mouseStart.z;
        this.selectorSide.geometry.vertices[1].x = 100;
        this.selectorSide.geometry.vertices[1].y = this.mouse.y;
        this.selectorSide.geometry.vertices[1].z = this.mouseStart.z;
        this.selectorSide.geometry.vertices[2].x = 100;
        this.selectorSide.geometry.vertices[2].y = this.mouse.y;
        this.selectorSide.geometry.vertices[2].z = this.mouse.z;
        this.selectorSide.geometry.vertices[3].x = 100;
        this.selectorSide.geometry.vertices[3].y = this.mouseStart.y;
        this.selectorSide.geometry.vertices[3].z = this.mouse.z;
        this.selectorSide.geometry.vertices[4].x = 100;
        this.selectorSide.geometry.vertices[4].y = this.mouseStart.y;
        this.selectorSide.geometry.vertices[4].z = this.mouseStart.z;
        this.selectorTop.geometry.vertices[0].y = 100;
        this.selectorTop.geometry.vertices[0].z = this.mouseStart.z;
        this.selectorTop.geometry.vertices[1].y = 100;
        this.selectorTop.geometry.vertices[1].z = this.mouseStart.z;
        this.selectorTop.geometry.vertices[2].y = 100;
        this.selectorTop.geometry.vertices[2].z = this.mouse.z;
        this.selectorTop.geometry.vertices[3].y = 100;
        this.selectorTop.geometry.vertices[3].z = this.mouse.z;
        this.selectorTop.geometry.vertices[4].y = 100;
        this.selectorTop.geometry.vertices[4].z = this.mouseStart.z;
        this.selectorFront.geometry.vertices[0].y = this.mouseStart.y;
        this.selectorFront.geometry.vertices[0].z = 100;
        this.selectorFront.geometry.vertices[1].y = this.mouseStart.y;
        this.selectorFront.geometry.vertices[1].z = 100;
        this.selectorFront.geometry.vertices[2].y = this.mouse.y;
        this.selectorFront.geometry.vertices[2].z = 100;
        this.selectorFront.geometry.vertices[3].y = this.mouse.y;
        this.selectorFront.geometry.vertices[3].z = 100;
        this.selectorFront.geometry.vertices[4].y = this.mouseStart.y;
        this.selectorFront.geometry.vertices[4].z = 100;
    }
    this.selectorTop.geometry.verticesNeedUpdate = true;
    this.selectorFront.geometry.verticesNeedUpdate = true;
    return this.selectorSide.geometry.verticesNeedUpdate = true;
  };

  Selector.prototype.end = function(mouseEnd) {
    this.mouseEnd = mouseEnd;
    return this.updateBounds();
  };

  Selector.prototype.updateBounds = function() {
    this.min.x = Math.min(this.getMinX(this.selectorTop), this.getMinX(this.selectorFront));
    this.max.x = Math.max(this.getMaxX(this.selectorTop), this.getMaxX(this.selectorFront));
    this.min.y = Math.min(this.getMinY(this.selectorFront), this.getMinY(this.selectorSide));
    this.max.y = Math.max(this.getMaxY(this.selectorFront), this.getMaxY(this.selectorSide));
    this.min.z = Math.min(this.getMinZ(this.selectorTop), this.getMinZ(this.selectorSide));
    return this.max.z = Math.max(this.getMaxZ(this.selectorTop), this.getMaxZ(this.selectorSide));
  };

  Selector.prototype.contains = function(point, direction) {
    var inside;
    inside = true;
    switch (direction) {
      case Utility.DIRECTION.ALL:
        if (point.x < this.min.x || point.x > this.max.x) {
          inside = false;
        }
        if (point.y < this.min.y || point.y > this.max.y) {
          inside = false;
        }
        if (point.z < this.min.z || point.z > this.max.z) {
          inside = false;
        }
        break;
      case Utility.DIRECTION.TOP:
        if (point.x < this.min.x || point.x > this.max.x) {
          inside = false;
        }
        if (point.z < this.min.z || point.z > this.max.z) {
          inside = false;
        }
        break;
      case Utility.DIRECTION.FRONT:
        if (point.x < this.min.x || point.x > this.max.x) {
          inside = false;
        }
        if (point.y < this.min.y || point.y > this.max.y) {
          inside = false;
        }
        break;
      case Utility.DIRECTION.SIDE:
        if (point.z < this.min.z || point.z > this.max.z) {
          inside = false;
        }
        if (point.y < this.min.y || point.y > this.max.y) {
          inside = false;
        }
    }
    return inside;
  };

  Selector.prototype.getMinX = function(selector) {
    var i, j, minX, vertices;
    vertices = selector.geometry.vertices;
    minX = vertices[0].x;
    for (i = j = 1; j <= 4; i = ++j) {
      if (vertices[i].x < minX) {
        minX = vertices[i].x;
      }
    }
    return minX;
  };

  Selector.prototype.getMaxX = function(selector) {
    var i, j, maxX, vertices;
    vertices = selector.geometry.vertices;
    maxX = vertices[0].x;
    for (i = j = 1; j <= 4; i = ++j) {
      if (vertices[i].x > maxX) {
        maxX = vertices[i].x;
      }
    }
    return maxX;
  };

  Selector.prototype.getMinY = function(selector) {
    var i, j, minY, vertices;
    vertices = selector.geometry.vertices;
    minY = vertices[0].y;
    for (i = j = 1; j <= 4; i = ++j) {
      if (vertices[i].y < minY) {
        minY = vertices[i].y;
      }
    }
    return minY;
  };

  Selector.prototype.getMaxY = function(selector) {
    var i, j, maxY, vertices;
    vertices = selector.geometry.vertices;
    maxY = vertices[0].y;
    for (i = j = 1; j <= 4; i = ++j) {
      if (vertices[i].y > maxY) {
        maxY = vertices[i].y;
      }
    }
    return maxY;
  };

  Selector.prototype.getMinZ = function(selector) {
    var i, j, minZ, vertices;
    vertices = selector.geometry.vertices;
    minZ = vertices[0].z;
    for (i = j = 1; j <= 4; i = ++j) {
      if (vertices[i].z < minZ) {
        minZ = vertices[i].z;
      }
    }
    return minZ;
  };

  Selector.prototype.getMaxZ = function(selector) {
    var i, j, maxZ, vertices;
    vertices = selector.geometry.vertices;
    maxZ = vertices[0].z;
    for (i = j = 1; j <= 4; i = ++j) {
      if (vertices[i].z > maxZ) {
        maxZ = vertices[i].z;
      }
    }
    return maxZ;
  };

  Selector.prototype.createSelector = function(direction) {
    var SIZE, geometry, selector;
    SIZE = 100;
    geometry = new THREE.Geometry();
    switch (direction) {
      case Utility.DIRECTION.TOP:
        geometry.vertices.push(new THREE.Vector3(+SIZE, +SIZE, +SIZE));
        geometry.vertices.push(new THREE.Vector3(-SIZE, +SIZE, +SIZE));
        geometry.vertices.push(new THREE.Vector3(-SIZE, +SIZE, -SIZE));
        geometry.vertices.push(new THREE.Vector3(+SIZE, +SIZE, -SIZE));
        geometry.vertices.push(new THREE.Vector3(+SIZE, +SIZE, +SIZE));
        break;
      case Utility.DIRECTION.FRONT:
        geometry.vertices.push(new THREE.Vector3(+SIZE, +SIZE, +SIZE));
        geometry.vertices.push(new THREE.Vector3(-SIZE, +SIZE, +SIZE));
        geometry.vertices.push(new THREE.Vector3(-SIZE, -SIZE, +SIZE));
        geometry.vertices.push(new THREE.Vector3(+SIZE, -SIZE, +SIZE));
        geometry.vertices.push(new THREE.Vector3(+SIZE, +SIZE, +SIZE));
        break;
      case Utility.DIRECTION.SIDE:
        geometry.vertices.push(new THREE.Vector3(+SIZE, +SIZE, +SIZE));
        geometry.vertices.push(new THREE.Vector3(+SIZE, -SIZE, +SIZE));
        geometry.vertices.push(new THREE.Vector3(+SIZE, -SIZE, -SIZE));
        geometry.vertices.push(new THREE.Vector3(+SIZE, +SIZE, -SIZE));
        geometry.vertices.push(new THREE.Vector3(+SIZE, +SIZE, +SIZE));
    }
    return selector = new THREE.Line(geometry, new THREE.LineBasicMaterial({
      color: Palette.SELECTOR.getHex()
    }), THREE.LineStrip);
  };

  return Selector;

})();

module.exports = Selector;


},{"./Palette.coffee":5,"./Utility.coffee":13}],9:[function(require,module,exports){
var Modal, Panel, Utility,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Panel = require('./Panel.coffee');

Utility = require('./Utility.coffee');

Modal = (function(superClass) {
  extend(Modal, superClass);

  Modal.prototype.modal = null;

  function Modal(id) {
    this.onClickDocument = bind(this.onClickDocument, this);
    Modal.__super__.constructor.call(this, id);
    this.modal = {
      title: {
        id: "#sidePanelTitle"
      },
      similar: {
        id: "#sidePanelBody .similar"
      },
      document: {
        id: "#sidePanelBody .article"
      },
      hr: {
        id: "#sidePanelBody hr"
      }
    };
    $(id).on('click', '.document', this.onClickDocument);
  }

  Modal.prototype.clear = function() {
    this.setTitle("");
    this.setDocumentHTML("");
    return this.setSimilarDocuments([]);
  };

  Modal.prototype.setTitle = function(title) {
    return $(this.modal.title.id).text(title);
  };

  Modal.prototype.setDocumentHTML = function(document) {
    $(this.modal.document.id).text("");
    return $(this.modal.document.id).html(document);
  };

  Modal.prototype.setSimilarDocuments = function(documents) {
    var d, html, j, len1;
    html = "";
    for (j = 0, len1 = documents.length; j < len1; j++) {
      d = documents[j];
      html += "<a class='document' data-doc-id='" + d.id + "'>" + d.title + "</a><br />";
    }
    $(this.modal.similar.id).text("");
    return $(this.modal.similar.id).append(html);
  };

  Modal.prototype.toggleHidden = function() {
    return $("#wrapper").toggleClass("toggled");
  };

  Modal.prototype.displayDocumentsList = function(documents) {
    var doc, docs, docsHtml, i, j, len, len1, title;
    this.clear();
    this.setTitle("Random Document Sample in Selected Clusters");
    if (Utility.isMobile()) {
      this.toggleHidden();
    }
    $(this.modal.similar.id).hide();
    $(this.modal.hr.id).hide();
    Array.prototype.shuffle = function() {
      return this.sort(function() {
        return 0.5 - Math.random();
      });
    };
    docs = documents.shuffle().slice(0, 46);
    len = 57;
    for (i = j = 0, len1 = docs.length; j < len1; i = ++j) {
      doc = docs[i];
      title = doc.title.substring(0, len);
      if (title.length === len) {
        title = title + '...';
      }
      docs[i].title = title;
    }
    docsHtml = ((function() {
      var k, len2, results;
      results = [];
      for (k = 0, len2 = docs.length; k < len2; k++) {
        doc = docs[k];
        results.push("<a class='document' data-doc-id='" + doc.id + "'>" + doc.title + "</a><br/>");
      }
      return results;
    })()).join('');
    return this.setDocumentHTML(docsHtml);
  };

  Modal.prototype.displayDocument = function(docId) {
    $(this.modal.similar.id).show();
    $(this.modal.hr.id).show();
    this.getDocumentContents(docId, (function(_this) {
      return function(data) {
        _this.setTitle(data.title);
        return _this.setDocumentHTML(data.html);
      };
    })(this));
    return this.getSimilarDocuments(docId, (function(_this) {
      return function(data) {
        return _this.setSimilarDocuments(data.most_similar);
      };
    })(this));
  };

  Modal.prototype.onClickDocument = function(event) {
    var docId;
    event.preventDefault();
    docId = $(event.target).data('doc-id');
    return this.displayDocument(docId);
  };

  Modal.prototype.getDocumentContents = function(id, callback) {
    return $.ajax({
      url: 'http://localhost:5000/doc/' + id,
      type: 'GET',
      contentType: 'application/json',
      success: callback
    });
  };

  Modal.prototype.getSimilarDocuments = function(id, callback) {
    return $.ajax({
      url: 'http://localhost:5000/doc/' + id + '/most_similar',
      type: 'GET',
      contentType: 'application/json',
      success: callback
    });
  };

  return Modal;

})(Panel);

module.exports = Modal;


},{"./Panel.coffee":6,"./Utility.coffee":13}],10:[function(require,module,exports){
var Storage, Subject,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

Subject = require('./Subject.coffee');

Storage = (function(superClass) {
  extend(Storage, superClass);

  Storage.EVENT_DATAFILE_READY = "EVENT_DATAFILE_READY";

  Storage.EVENT_JSON_READY = "EVENT_JSON_READY";

  Storage.EVENT_DATA_READY = "EVENT_DATA_READY";

  Storage.EVENT_SCREENSHOT_OK = "EVENT_SCREENSHOT_OK";

  Storage.prototype.datafile = null;

  Storage.prototype.data = null;

  Storage.prototype.points = 0;

  Storage.prototype.clusterIDs = null;

  Storage.prototype.clusters = 0;

  Storage.prototype.saved = 0;

  function Storage() {
    this.processPoint = bind(this.processPoint, this);
    this.onSaveResponse = bind(this.onSaveResponse, this);
    this.onJSON = bind(this.onJSON, this);
    this.onDatafile = bind(this.onDatafile, this);
    Storage.__super__.constructor.call(this);
    this.clusterIDs = new Array();
  }

  Storage.prototype.onDatafile = function(datafile) {
    this.datafile = datafile;
    this.notify(Storage.EVENT_DATAFILE_READY);
    return this.requestJSON(this.datafile);
  };

  Storage.prototype.onJSON = function(data) {
    this.data = data;
    this.notify(Storage.EVENT_JSON_READY);
    $.each(this.data.points, this.processPoint);
    return this.notify(Storage.EVENT_DATA_READY);
  };

  Storage.prototype.onSaveResponse = function(message) {
    console.log("DataProjector.onSaveResponse " + message);
    return this.notify(Storage.EVENT_SCREENSHOT_OK);
  };

  Storage.prototype.requestData = function() {
    return this.requestDatafile();
  };

  Storage.prototype.requestDatafile = function() {
    return this.onDatafile("data.json");
  };

  Storage.prototype.requestJSON = function(datafile) {
    var file;
    this.datafile = datafile;
    file = this.datafile + "?" + String(Math.round(Math.random() * 99999));
    return $.getJSON(file, this.onJSON);
  };

  Storage.prototype.saveImage = function(base64Image) {
    return $.post('/upload', {
      id: ++this.saved,
      image: base64Image
    }, this.onSaveResponse);
  };

  Storage.prototype.processPoint = function(nodeName, nodeData) {
    var ref;
    if (ref = nodeData.cid, indexOf.call(this.clusterIDs, ref) < 0) {
      this.clusterIDs.push(nodeData.cid);
      this.clusters = this.clusterIDs.length;
    }
    return this.points++;
  };

  Storage.prototype.getDatafile = function() {
    return this.datafile;
  };

  Storage.prototype.getData = function() {
    return this.data;
  };

  Storage.prototype.getClusters = function() {
    return this.clusters;
  };

  Storage.prototype.getPoints = function() {
    return this.points;
  };

  Storage.prototype.getSaved = function() {
    return this.saved;
  };

  return Storage;

})(Subject);

module.exports = Storage;


},{"./Subject.coffee":11}],11:[function(require,module,exports){
var Subject;

Subject = (function() {
  Subject.prototype.observers = null;

  function Subject() {
    this.observers = new Array();
  }

  Subject.prototype.attach = function(o) {
    return this.observers.push(o);
  };

  Subject.prototype.detach = function(o) {
    var index;
    index = this.observers.indexOf(o);
    if (index >= 0) {
      return this.observers.splice(index, 1);
    }
  };

  Subject.prototype.notify = function(type, data) {
    var i, len, o, ref, results;
    if (data == null) {
      data = null;
    }
    ref = this.observers;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      o = ref[i];
      results.push(o.update(this, type, data));
    }
    return results;
  };

  return Subject;

})();

module.exports = Subject;


},{}],12:[function(require,module,exports){
var Palette, Panel, Toolbar, Utility,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Utility = require('./Utility.coffee');

Panel = require('./Panel.coffee');

Palette = require('./Palette.coffee');

Toolbar = (function(superClass) {
  extend(Toolbar, superClass);

  Toolbar.EVENT_MENU = "EVENT_MENU";

  Toolbar.EVENT_INFO = "EVENT_INFO";

  Toolbar.EVENT_PERSPECTIVE = "EVENT_PERSPECTIVE";

  Toolbar.EVENT_ORTHOGRAPHIC = "EVENT_ORTHOGRAPHIC";

  Toolbar.EVENT_DUAL = "EVENT_DUAL";

  Toolbar.EVENT_RESET = "EVENT_RESET";

  Toolbar.EVENT_CLEAR = "EVENT_CLEAR";

  Toolbar.EVENT_BOX = "EVENT_BOX";

  Toolbar.EVENT_VIEWPORT = "EVENT_VIEWPORT";

  Toolbar.EVENT_SELECT = "EVENT_SELECT";

  Toolbar.EVENT_VIEW_TOP = "EVENT_VIEW_TOP";

  Toolbar.EVENT_VIEW_FRONT = "EVENT_VIEW_FRONT";

  Toolbar.EVENT_VIEW_SIDE = "EVENT_VIEW_SIDE";

  Toolbar.EVENT_SPIN_LEFT = "EVENT_SPIN_LEFT";

  Toolbar.EVENT_SPIN_STOP = "EVENT_SPIN_STOP";

  Toolbar.EVENT_SPIN_RIGHT = "EVENT_SPIN_RIGHT";

  Toolbar.EVENT_ANIMATE = "EVENT_ANIMATE";

  Toolbar.EVENT_SPIN_TOGGLE = "EVENT_SPIN_TOGGLE";

  Toolbar.EVENT_SHOW_DOCUMENTS = "EVENT_SHOW_DOCUMENTS";

  Toolbar.prototype.dispatcher = null;

  function Toolbar(id) {
    this.setAnimateButtonSelected = bind(this.setAnimateButtonSelected, this);
    this.setSpinButtonSelected = bind(this.setSpinButtonSelected, this);
    this.setViewButtonSelected = bind(this.setViewButtonSelected, this);
    this.setSelectButtonSelected = bind(this.setSelectButtonSelected, this);
    this.setViewportButtonSelected = bind(this.setViewportButtonSelected, this);
    this.setBoxButtonSelected = bind(this.setBoxButtonSelected, this);
    this.blinkClearButton = bind(this.blinkClearButton, this);
    this.blinkResetButton = bind(this.blinkResetButton, this);
    this.setCameraButtonSelected = bind(this.setCameraButtonSelected, this);
    this.setInfoButtonSelected = bind(this.setInfoButtonSelected, this);
    this.setMenuButtonSelected = bind(this.setMenuButtonSelected, this);
    this.unblinkButton = bind(this.unblinkButton, this);
    this.blinkButton = bind(this.blinkButton, this);
    this.setButtonSelected = bind(this.setButtonSelected, this);
    this.initialize = bind(this.initialize, this);
    this.createDispatcher = bind(this.createDispatcher, this);
    this.onClick = bind(this.onClick, this);
    this.onKeyDown = bind(this.onKeyDown, this);
    var i, item, len, ref;
    Toolbar.__super__.constructor.call(this, id);
    this.createDispatcher();
    ref = this.dispatcher;
    for (i = 0, len = ref.length; i < len; i++) {
      item = ref[i];
      $(item.id).click({
        type: item.type
      }, this.onClick);
    }
    document.addEventListener('keydown', this.onKeyDown, false);
    this.initialize();
  }

  Toolbar.prototype.onKeyDown = function(event) {
    var i, item, len, modifier, ref, results;
    modifier = Utility.NO_KEY;
    if (event.shiftKey) {
      modifier = Utility.SHIFT_KEY;
    }
    ref = this.dispatcher;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      item = ref[i];
      if ((item.key === event.keyCode) && (item.modifier === modifier)) {
        results.push(this.notify(item.type));
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  Toolbar.prototype.onClick = function(event) {
    return this.notify(event.data.type);
  };

  Toolbar.prototype.createDispatcher = function() {
    return this.dispatcher = [
      {
        id: "#menuButton",
        key: 77,
        modifier: Utility.NO_KEY,
        type: Toolbar.EVENT_MENU
      }, {
        id: "#infoButton",
        key: 73,
        modifier: Utility.NO_KEY,
        type: Toolbar.EVENT_INFO
      }, {
        id: "#perspectiveButton",
        key: 80,
        modifier: Utility.NO_KEY,
        type: Toolbar.EVENT_PERSPECTIVE
      }, {
        id: "#orthographicButton",
        key: 79,
        modifier: Utility.NO_KEY,
        type: Toolbar.EVENT_ORTHOGRAPHIC
      }, {
        id: "#dualButton",
        key: 68,
        modifier: Utility.NO_KEY,
        type: Toolbar.EVENT_DUAL
      }, {
        id: "#resetButton",
        key: 82,
        modifier: Utility.NO_KEY,
        type: Toolbar.EVENT_RESET
      }, {
        id: "#clearButton",
        key: 67,
        modifier: Utility.NO_KEY,
        type: Toolbar.EVENT_CLEAR
      }, {
        id: "#boxButton",
        key: 66,
        modifier: Utility.NO_KEY,
        type: Toolbar.EVENT_BOX
      }, {
        id: "#viewportButton",
        key: 86,
        modifier: Utility.NO_KEY,
        type: Toolbar.EVENT_VIEWPORT
      }, {
        id: "#viewTopButton",
        key: 49,
        modifier: Utility.NO_KEY,
        type: Toolbar.EVENT_VIEW_TOP
      }, {
        id: "#viewFrontButton",
        key: 50,
        modifier: Utility.NO_KEY,
        type: Toolbar.EVENT_VIEW_FRONT
      }, {
        id: "#viewSideButton",
        key: 51,
        modifier: Utility.NO_KEY,
        type: Toolbar.EVENT_VIEW_SIDE
      }, {
        id: "#spinLeftButton",
        key: 37,
        modifier: Utility.NO_KEY,
        type: Toolbar.EVENT_SPIN_LEFT
      }, {
        id: "#spinStopButton",
        key: 32,
        modifier: Utility.NO_KEY,
        type: Toolbar.EVENT_SPIN_STOP
      }, {
        id: "#spinRightButton",
        key: 39,
        modifier: Utility.NO_KEY,
        type: Toolbar.EVENT_SPIN_RIGHT
      }, {
        id: "#toggleSpinButton",
        key: 0,
        modifier: Utility.NO_KEY,
        type: Toolbar.EVENT_SPIN_TOGGLE
      }, {
        id: "#toggleArticlesButton",
        key: 0,
        modifier: Utility.NO_KEY,
        type: Toolbar.EVENT_SHOW_DOCUMENTS
      }
    ];
  };

  Toolbar.prototype.initialize = function() {
    this.setButtonSelected("#menuButton", true);
    this.setButtonSelected("#infoButton", true);
    this.setButtonSelected("#perspectiveButton", false);
    this.setButtonSelected("#orthographicButton", false);
    this.setButtonSelected("#dualButton", true);
    this.setButtonSelected("#boxButton", true);
    this.setButtonSelected("#viewportButton", true);
    this.setButtonSelected("#selectButton", false);
    this.setButtonSelected("#viewTopButton", true);
    this.setButtonSelected("#viewFrontButton", false);
    this.setButtonSelected("#viewSideButton", false);
    this.setButtonSelected("#spinLeftButton", false);
    this.setButtonSelected("#spinStopButton", true);
    return this.setButtonSelected("#spinRightButton", false);
  };

  Toolbar.prototype.setButtonSelected = function(id, selected) {
    var color;
    color = Palette.BUTTON.getStyle();
    if (selected) {
      color = Palette.BUTTON_SELECTED.getStyle();
    }
    return $(id).css('color', color);
  };

  Toolbar.prototype.blinkButton = function(id) {
    this.setButtonSelected(id, true);
    return window.setTimeout(this.unblinkButton, 200, id);
  };

  Toolbar.prototype.unblinkButton = function(id) {
    console.log("Toolbar.unblinkButton " + id);
    return this.setButtonSelected(id, false);
  };

  Toolbar.prototype.setMenuButtonSelected = function(selected) {
    return this.setButtonSelected("#menuButton", selected);
  };

  Toolbar.prototype.setInfoButtonSelected = function(selected) {
    return this.setButtonSelected("#infoButton", selected);
  };

  Toolbar.prototype.setCameraButtonSelected = function(selected1, selected2, selected3) {
    this.setButtonSelected("#perspectiveButton", selected1);
    this.setButtonSelected("#orthographicButton", selected2);
    return this.setButtonSelected("#dualButton", selected3);
  };

  Toolbar.prototype.blinkResetButton = function() {
    return this.blinkButton("#resetButton");
  };

  Toolbar.prototype.blinkClearButton = function() {
    return this.blinkButton("#clearButton");
  };

  Toolbar.prototype.setBoxButtonSelected = function(selected) {
    return this.setButtonSelected("#boxButton", selected);
  };

  Toolbar.prototype.setViewportButtonSelected = function(selected) {
    return this.setButtonSelected("#viewportButton", selected);
  };

  Toolbar.prototype.setSelectButtonSelected = function(selected) {
    return this.setButtonSelected("#selectButton", selected);
  };

  Toolbar.prototype.setViewButtonSelected = function(selected1, selected2, selected3) {
    this.setButtonSelected("#viewTopButton", selected1);
    this.setButtonSelected("#viewFrontButton", selected2);
    return this.setButtonSelected("#viewSideButton", selected3);
  };

  Toolbar.prototype.setSpinButtonSelected = function(selected1, selected2, selected3) {
    this.setButtonSelected("#spinLeftButton", selected1);
    this.setButtonSelected("#spinStopButton", selected2);
    return this.setButtonSelected("#spinRightButton", selected3);
  };

  Toolbar.prototype.setAnimateButtonSelected = function(selected) {
    return this.setButtonSelected("#animateButton", selected);
  };

  return Toolbar;

})(Panel);

module.exports = Toolbar;


},{"./Palette.coffee":5,"./Panel.coffee":6,"./Utility.coffee":13}],13:[function(require,module,exports){
var Utility;

Utility = (function() {
  function Utility() {}

  Utility.DIRECTION = {
    ALL: 0,
    TOP: 1,
    FRONT: 2,
    SIDE: 3
  };

  Utility.DEGREE = Math.PI / 180;

  Utility.SECOND = 1000;

  Utility.NO_KEY = "NO_KEY";

  Utility.SHIFT_KEY = "SHIFT_KEY";

  Utility.CTRL_KEY = "CTRL_KEY";

  Utility.ALT_KEY = "ALT_KEY";

  Utility.SCREEN = {
    MOBILE: 768
  };

  Utility.isMobile = function() {
    return window.innerWidth <= this.SCREEN.MOBILE;
  };

  Utility.printVector3 = function(vector) {
    return console.log(vector.x.toFixed(1) + " : " + vector.y.toFixed(1) + " : " + vector.z.toFixed(1));
  };

  return Utility;

})();

module.exports = Utility;


},{}]},{},[1]);
