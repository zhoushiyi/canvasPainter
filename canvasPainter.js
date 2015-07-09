var _canvas = null;
var _context = null;
var _auxCanvas = null;
var _auxContext = null;
var _paint = false;
var _drawMode = "";
var _color = "black";
var _lineWidth = 1; 	//铅笔线宽
var _brushWidth = 10; 	//画刷线宽
var _eraserWidth = 15;	
var _backgroundColor = "#FFFFCC";
var _textJbox = null;
var _edit = false;
var _fill = false;

var _lineObj = null;
var _squareObj = null;
var _circleObj = null;
var _eraserObj = null;
var _textObj = null;
var _syncObj = null;

var _syncLineObj = null;
var _syncSquareObj = null;
var _syncCircleObj = null;
var _syncTextObj = null;

var _drawCache = new Array();
var _redoCache = new Array();


$().ready(function(){
	_canvas = document.getElementById("canvas");
	_context = _canvas.getContext("2d");
	_auxCanvas = document.getElementById("auxCanvas");
	_auxContext = _auxCanvas.getContext("2d");

	_lineObj = new Line();
	_squareObj = new Square();
	_circleObj = new Circle();
	_eraserObj = new Eraser();
	_textObj = new Text();
	_syncObj = new Sync();
	_syncLineObj = new SyncLine();
	_syncSquareObj = new SyncSquare();
	_syncCircleObj = new SyncCircle();
	_syncTextObj = new syncText();

    var auxCanvas = $('#auxCanvas');

	//加事件
    auxCanvas.mousedown(function(e){
		var mouseX = e.pageX - this.offsetLeft;
		var mouseY = e.pageY - this.offsetTop;
		if (_drawMode == "mode-pencil") {
			_paint = true;
			_lineObj.x = mouseX;
			_lineObj.y = mouseY;
			_lineObj.lineWidth = _lineWidth;
			_lineObj.context = _context;
			_lineObj.color = _color;
            _lineObj.moveTo();
            
            _syncLineObj.beginPos.x = mouseX;
            _syncLineObj.beginPos.y = mouseY;
            _syncLineObj.color = _color;
            _syncLineObj.lineWidth = _lineObj.lineWidth;
            _syncObj.drawObj = _syncLineObj;
            _syncObj.drawType = _drawMode;
		} else if (_drawMode == "mode-outlinedRect" || _drawMode == "mode-filledRect") {
			_paint = true;
			_squareObj.bx = mouseX;
			_squareObj.by = mouseY;
			_squareObj.ex = mouseX;
			_squareObj.ey = mouseY;
			_squareObj.context = _auxContext;
			_squareObj.color = _color;
			
			_syncSquareObj.beginPos.x = mouseX;
			_syncSquareObj.beginPos.y = mouseY;
			_syncSquareObj.fill = _fill;
			_syncSquareObj.color = _color;
			_syncSquareObj.lineWidth = _squareObj.lineWidth;
			_syncObj.drawObj = _syncSquareObj;
			_syncObj.drawType = _drawMode;
		} else if (_drawMode == "mode-outlinedCircle" || _drawMode == "mode-filledCircle") {
			_paint = true;
			_circleObj.bx = mouseX;
			_circleObj.by = mouseY;
			_circleObj.ex = mouseX;
			_circleObj.ey = mouseY;
			_circleObj.context = _auxContext;
			_circleObj.color = _color;
			
			_syncCircleObj.beginPos.x = mouseX;
			_syncCircleObj.beginPos.y = mouseY;
			_syncCircleObj.color = _color;
			_syncCircleObj.lineWidth = _circleObj.lineWidth;
			_syncCircleObj.fill = _fill;
			_syncObj.drawObj = _syncCircleObj;
			_syncObj.drawType = _drawMode;
		} else if (_drawMode == "mode-eraser") {
			_paint = true;
			_eraserObj.x = mouseX;
			_eraserObj.y = mouseY;
			_eraserObj.context = _context;
			_eraserObj.moveTo();
		} else if (_drawMode == "mode-text") {
			_paint = true;
			if (!_edit) {
				_edit = true;
				_textObj.x = mouseX;
				_textObj.y = mouseY;
				_textObj.context = _context;
				if (_textJbox == null) {
					_textJbox = new jBox('Modal', {
						overlay: false,
						position:{
							x: e.pageX,
							y: e.pageY-20
						},
						id : "jbox",
						closeButton:'none',
						onCloseComplete : function() {
							_paint = false;
							_edit = false;
							if (_textJbox) {
								_textJbox.destroy();
								_textJbox = null;
							}
						},
						onOpen: function(){
							var color = $('#colorPicker').attr("value");
							$('#textBox').css("color", color);
						},
						//attach: $('#myModal'),
						content: '<input id="textBox" type="text" style="border:none;outline:medium;" onMouseOver="this.focus()" onblur="drawText()">'
					});
				}
				if (_textJbox) {
					_textJbox.open();
				}
				
				_syncTextObj.beginPos.x = mouseX;
				_syncTextObj.beginPos.y = mouseY;
				_syncObj.drawObj = _syncTextObj;
				_syncObj.drawType = _drawMode;
			}
		} else if (_drawMode == "mode-brush") {
			_paint = true;
			_lineObj.x = mouseX;
			_lineObj.y = mouseY;
			_lineObj.context = _context;
			_lineObj.lineWidth = _brushWidth;
			_lineObj.moveTo();
			_lineObj.color = _color;

			_syncLineObj.beginPos.x = mouseX;
			_syncLineObj.beginPos.y = mouseY;
			_syncLineObj.color = _color;
			_syncLineObj.lineWidth = _lineObj.lineWidth;
			_syncObj.drawObj = _syncLineObj;
			_syncObj.drawType = _drawMode;
		}
	});
    auxCanvas.mousemove(function(e){
		if(_paint==true){
			var mouseX = e.pageX - this.offsetLeft;
			var mouseY = e.pageY - this.offsetTop;
			if (_drawMode == "mode-pencil" || _drawMode == "mode-brush") {
				_lineObj.lineTo(mouseX, mouseY);
                
                var pos = new Pos();
                pos.x = mouseX;
                pos.y = mouseY;
                _syncObj.drawObj.endPosArr.push(pos);
			} else if (_drawMode == "mode-outlinedRect" || _drawMode == "mode-filledRect") {
				_squareObj.ex = mouseX;
				_squareObj.ey = mouseY;
				clearAux();
				if (_drawMode == "mode-filledRect") {
					_squareObj.drawRect(true);
				} else {
					_squareObj.drawRect(false);
				}
			} else if (_drawMode == "mode-outlinedCircle" || _drawMode == "mode-filledCircle") {
				_circleObj.ex = mouseX;
				_circleObj.ey = mouseY;
				clearAux();
				if (_drawMode == "mode-filledCircle") {
					_circleObj.drawCircle(true);
				} else {
					_circleObj.drawCircle(false);
				}
			} else if (_drawMode == "mode-eraser") {
				_eraserObj.lineTo(mouseX, mouseY);
			} 
		}
	});

    auxCanvas.mouseup(function(e){
		if(_paint==true){
			var mouseX = e.pageX - this.offsetLeft;
			var mouseY = e.pageY - this.offsetTop;
			if (_drawMode == "mode-outlinedRect" || _drawMode == "mode-filledRect") {
				_squareObj.ex = mouseX;
				_squareObj.ey = mouseY;
				_squareObj.context = _context;
				clearAux();
				if (_drawMode == "mode-filledRect") {
					_squareObj.drawRect(true);
					_syncObj.drawObj.fill = true;
				} else {
					_squareObj.drawRect(false);
					_syncObj.drawObj.fill = false;
				}
				
				_syncObj.drawObj.endPos.x = _squareObj.ex;
				_syncObj.drawObj.endPos.y = _squareObj.ey;
				makeSync(_syncObj);
			} else if (_drawMode == "mode-outlinedCircle" || _drawMode == "mode-filledCircle") {
				_circleObj.ex = mouseX;
				_circleObj.ey = mouseY;
				_circleObj.context = _context;
				clearAux();
				if (_drawMode == "mode-filledCircle") {
					_circleObj.drawCircle(true);
					_syncObj.drawObj.fill = true;
				} else {
					_circleObj.drawCircle(false);
					_syncObj.drawObj.fill = false;
				}
				
				_syncObj.drawObj.endPos.x = mouseX;
				_syncObj.drawObj.endPos.y = mouseY;
				makeSync(_syncObj);
			} else if (_drawMode == "mode-pencil" || _drawMode == "mode-brush"){
                makeSync(_syncObj);
            } 
			_context.closePath();
		}
		_paint = false;
	});

    auxCanvas.mouseleave(function(e){
		_paint = false;
		clearAux();
	});

	$.fn.colorPicker.defaults.showHexField = false;
	$('#colorPicker').colorPicker({ onColorChange : function(id,value){colorChange(value);} });

	Mousetrap.bind('ctrl+z', function() { undo();});
	Mousetrap.bind('ctrl+y', function() { repeat();});

	document.getElementById('clearBtn').onclick = function(){ clearAll(); clearCache(); };
	$('[data-toggle="tooltip"]').tooltip();

});

function PaintTool(lineWidth, color, ctx){
	this.lineWidth = lineWidth;
	this.lineJoin = "round";
	this.lineCap = "round";
	this.color = color;
	this.context = ctx;
	this.setStyle = function(){
		this.context.strokeStyle = this.color;
		this.context.fillStyle = this.color;
		this.context.lineWidth = this.lineWidth;
		this.context.lineJoin = this.lineJoin;
		this.context.lineCap = this.lineCap;
	}
}

function Line(){
	this.x = 0;
	this.y = 0;
	this.paintTool = PaintTool;
	this.paintTool(_lineWidth, _color, _context);
	this.moveTo = function() {
        this.context.beginPath();
        this.context.moveTo(this.x, this.y);
    };
	this.lineTo = function(dx, dy){
		if (_drawMode == "mode-eraser") {
			this.color = "white";
		}
		this.setStyle();
		this.context.lineTo(dx, dy);
		this.context.stroke();
	}
}

function SyncLine(){
	this.beginPos = new Pos();
	this.endPosArr = new Array();
	this.color = 0;
	this.lineWidth = 0;
}

function Square(){
	this.bx = 0;
	this.by = 0;
	this.ex = 0;
	this.ey = 0;
	this.w = 0;
	this.h = 0;
	this.paintTool = PaintTool;
	this.paintTool(_lineWidth, _color, _auxContext);
	this.context = _auxCanvas;
	this.direct = 0;	//右下0，左下1，左上2，右上3
	this.direction = function(x,y) {
		if (x >= this.bx && y >= this.by) {
			this.direct = 0;
		} else if (x < this.bx && y > this.by) {
			this.direct = 1;
		} else if (x < this.bx && y < this.by) {
			this.direct = 2;
		} else if (x > this.bx && y < this.by) {
			this.direct = 3;
		}
	};
	this.drawRect = function(fill){
		this.w = Math.abs(this.ex - this.bx);
		this.h = Math.abs(this.ey - this.by);
		var x = -1;
		var y = -1;
		this.direction(this.ex, this.ey);
		switch(this.direct) {
			case 0:
				x = this.bx;
				y = this.by;
				break;
			case 1:
				x = this.ex;
				y = this.by;
				break;
			case 2:
				x = this.ex;
				y = this.ey;
				break;
			case 3:
				x = this.bx;
				y = this.ey;
				break;
		}
		if (this.context && x >=0 && y >=0) {
			this.setStyle();
			if (fill == true) {
				this.context.fillRect(x,y,this.w,this.h);
			} else {
				this.context.strokeRect(x,y,this.w,this.h);
			}
		}

	}
}

function SyncSquare(){
	this.beginPos = new Pos();
	this.endPos = new Pos();
	this.color = 0;
	this.lineWidth = 0;
	this.fill = false;
}

function Circle(){
	this.bx = 0;
	this.by = 0;
	this.ex = 0;
	this.ey = 0;
	this.radius = 0;
	this.context = _auxCanvas;
	this.paintTool = PaintTool;
	this.paintTool(_lineWidth, _color, _auxContext);
	this.calRadius = function() {
		var x = Math.abs(this.ex - this.bx);
		var y = Math.abs(this.ey - this.by);
		this.radius = Math.sqrt(x*x + y*y);
	};
	this.drawCircle = function(fill){
		this.calRadius();
		this.context.beginPath();
		this.setStyle();
		this.context.arc(this.bx,this.by,this.radius, 0, Math.PI*2, true);
		if (fill == true) {
			this.context.fill();
		} else {
			this.context.stroke();
		}
		this.context.closePath();
	}
}

function SyncCircle(){
	this.beginPos = new Pos();
	this.endPos = new Pos();
	this.color = 0;
	this.lineWidth = 0;
	this.fill = false;
}

function Eraser(){
	this.line = Line;
	this.line();
	this.lineWidth = _eraserWidth;
	this.color = _backgroundColor;
}

function Text(){
	this.x = 0;
	this.y = 0;
	this.paintTool = PaintTool;
	this.paintTool(_lineWidth, _color, _context);
	this.fillText = function(text){
		this.setStyle();
		this.context.font = "18px sans-serif";
		this.context.textBaseline="middle";
		this.context.fillText(text, this.x, this.y);
	}
}

function syncText(){
	this.beginPos = new Pos();
	this.text = "";
	this.color = 0;
}

function Pos(){
    this.x = 0;
    this.y = 0;
}

function Sync(){
    this.drawType = "";
	this.drawObj = null;
}

function makeSync(sync){
	var str = $.toJSON(sync);
	_drawCache.push(str);
	_redoCache.splice(0,_redoCache.length);
    if (sync.drawType == "mode-pencil" || sync.drawType == "mode-brush") {
    	sync.drawObj.endPosArr.splice(0, sync.drawObj.endPosArr.length);
    } 
}

function SyncCanvas(syncStr){
    var sync = $.parseJSON(syncStr);
    if (sync.drawType == "mode-pencil") {
        _lineObj.x = sync.drawObj.beginPos.x;
        _lineObj.y = sync.drawObj.beginPos.y;
        _lineObj.color = sync.drawObj.color;
        _lineObj.lineWidth = sync.drawObj.lineWidth;
        _lineObj.context = _syncContext;
        _lineObj.moveTo();
        for(var i = 0; i < sync.drawObj.endPosArr.length; i++) {
            _lineObj.lineTo(sync.drawObj.endPosArr[i].x, sync.drawObj.endPosArr[i].y);
        }
        _syncContext.closePath();
    } else if (sync.drawType == "mode-square") {
    	_squareObj.bx = sync.drawObj.beginPos.x;
    	_squareObj.by = sync.drawObj.beginPos.y;
    	_squareObj.ex = sync.drawObj.endPos.x;
    	_squareObj.ey = sync.drawObj.endPos.y;
    	_squareObj.color = sync.drawObj.color;
    	_squareObj.lineWidth = sync.drawObj.lineWidth;
    	_squareObj.context = _syncContext;
    	_squareObj.drawRect(sync.drawObj.fill);
    } else if (sync.drawType == "mode-circle") {
		_circleObj.bx = sync.drawObj.beginPos.x;
		_circleObj.by = sync.drawObj.beginPos.y;
		_circleObj.ex = sync.drawObj.endPos.x;
		_circleObj.ey = sync.drawObj.endPos.y;
		_circleObj.color = sync.drawObj.color;
		_circleObj.lineWidth = sync.drawObj.lineWidth;
		_circleObj.context = _syncContext;
		_circleObj.drawCircle(sync.drawObj.fill);
    } else if (sync.drawType == "mode-brush") {
		_lineObj.x = sync.drawObj.beginPos.x;
		_lineObj.y = sync.drawObj.beginPos.y;
		_lineObj.color = sync.drawObj.color;
		_lineObj.lineWidth = sync.drawObj.lineWidth;
		_lineObj.context = _syncContext;
		_lineObj.moveTo();
		for(var i = 0; i < sync.drawObj.endPosArr.length; i++) {
			_lineObj.lineTo(sync.drawObj.endPosArr[i].x, sync.drawObj.endPosArr[i].y);
		}
		_syncContext.closePath();
    } else if (sync.drawType == "mode-eraser") {

    } else if (sync.drawType == "mode-text") {
		_textObj.context = _syncContext;
		_textObj.x = sync.drawObj.beginPos.x;
		_textObj.y = sync.drawObj.beginPos.y;
		_textObj.color = sync.drawObj.color;
		_textObj.fillText(sync.drawObj.text);
    }
}

function clearAll(){
	//_canvas.width = _canvas.width; //不推荐
	_context.clearRect(0,0,800,800);
	drawImg();
}
function clearAux(){
	_auxContext.clearRect(0,0,800,800);
}
function clearCache(){
	_drawCache.splice(0, _drawCache.length);
	_redoCache.splice(0,_redoCache.length);
}

function changeMode(mode){
	_drawMode = mode;
	if (_drawMode == "mode-pencil") {
		$('#auxCanvas').awesomeCursor('pencil', {
			color: '#34db33',
			size: 32,
			rotate: 90
		});
		//$('#auxCanvas').css("cursor", "url('aero_pen.cur'),auto");
	} else if (_drawMode == "mode-brush") {
		$('#auxCanvas').awesomeCursor('paint-brush', {
			color: '#34db33',
			size: 32,
			rotate: 90
		});
	} else if (_drawMode == "mode-filledRect" || _drawMode == "mode-outlinedRect" || _drawMode == "mode-outlinedCircle" || _drawMode == "mode-filledCircle") {
		$('#auxCanvas').awesomeCursor('crosshairs', {
			color: '#34db33',
			size: 32
		});
	} else if (_drawMode == "mode-eraser") {
		$('#auxCanvas').awesomeCursor('eraser', {
			color: '#34db33',
			size: 32
		});
	} else if (_drawMode == "mode-text") {
		$('#auxCanvas').css("cursor", "text");
	}

}

function drawImg(){
	var img = new Image();
	img.src = "text.gif";
	img.onload = function(){
		var width = img.width;
		var height = img.height;
		_canvas.width = width;
		_canvas.height = height;
		_context.createPattern(img, "no-repeat");
		_context.drawImage(img,0,0);
	}
}

function drawText(){
	if (_paint == true && _edit == true) {
		var box = document.getElementById('textBox');
		if (box) {
			var text = box.value;
			_textObj.color = _color;
			_textObj.fillText(text);
			box.value = "";
			_textJbox.destroy();
			_textJbox = null;
			_edit = false;
			_paint = false;
			//同步
			_syncObj.drawObj.text = text;
			_syncObj.drawObj.color = _textObj.color;
			makeSync(_syncObj);
		}
	}

}

function fillToggle(){
	_fill = !_fill;
}

function undo(){
	if (_drawCache.length > 0) {
		clearAll();
		var tmp = _drawCache.pop();
		_redoCache.push(tmp);
		redraw(_drawCache);
	}
}

function repeat(){
	if (_redoCache.length > 0) {
		var tmp = _redoCache.pop();
		var arr = [];
		arr.push(tmp);
		redraw(arr);
		_drawCache.push(tmp);
	}
}

function redraw(cache){
	for(var j = 0; j < cache.length; j++) {
		var sync = $.parseJSON(cache[j]);
		drawSync(sync, _context);
	}
}

function drawSync(sync, context) {
	if (sync) {
		if (sync.drawType == "mode-pencil" || sync.drawType == "mode-brush") {
	        _lineObj.x = sync.drawObj.beginPos.x;
	        _lineObj.y = sync.drawObj.beginPos.y;
	        _lineObj.color = sync.drawObj.color;
	        _lineObj.lineWidth = sync.drawObj.lineWidth;
	        _lineObj.context = context;
	        _lineObj.moveTo();
	        for(var i = 0; i < sync.drawObj.endPosArr.length; i++) {
	            _lineObj.lineTo(sync.drawObj.endPosArr[i].x, sync.drawObj.endPosArr[i].y);
	        }
	        _context.closePath();
	    } else if (sync.drawType == "mode-outlinedRect" || sync.drawType == "mode-filledRect") {
	    	_squareObj.bx = sync.drawObj.beginPos.x;
	    	_squareObj.by = sync.drawObj.beginPos.y;
	    	_squareObj.ex = sync.drawObj.endPos.x;
    		_squareObj.ey = sync.drawObj.endPos.y;
	    	_squareObj.color = sync.drawObj.color;
	    	_squareObj.lineWidth = sync.drawObj.lineWidth;
	    	_squareObj.context = context;
	    	_squareObj.drawRect(sync.drawObj.fill);
	    } else if (sync.drawType == "mode-outlinedCircle" || sync.drawType == "mode-filledCircle") {
			_circleObj.bx = sync.drawObj.beginPos.x;
			_circleObj.by = sync.drawObj.beginPos.y;
			_circleObj.ex = sync.drawObj.endPos.x;
			_circleObj.ey = sync.drawObj.endPos.y;
			_circleObj.color = sync.drawObj.color;
			_circleObj.lineWidth = sync.drawObj.lineWidth;
			_circleObj.context = context;
			_circleObj.drawCircle(sync.drawObj.fill);
	    } else if (sync.drawType == "mode-text") {
			_textObj.context = context;
			_textObj.x = sync.drawObj.beginPos.x;
			_textObj.y = sync.drawObj.beginPos.y;
			_textObj.color = sync.drawObj.color;
			_textObj.fillText(sync.drawObj.text);
	    } else if (sync.drawType == "clear") {
	    	clearCanvas();
	    }
	}
}

function colorChange(value){
	//console.log(value);
	_color = value;
}