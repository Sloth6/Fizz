var colors  = require('colors');
var fs = require('fs');
var debug = true;
var sanitize = require('validator').sanitize;
var stackTrace = require('stack-trace');

colors.setTheme({
  info: 'rainbow',
  debug: 'blue',
  error: 'red',
  data: 'grey'
});

module.exports.log = function() {
	var s = '\tInfo: ';
	var e;
	for (var i = 0; i < arguments.length; i++) {
		e = arguments[i];
		s += ((e instanceof Object) ? JSON.stringify(e) : e)+' ';
	}
	console.log(s.data);
  console.log('\t'+'—————————————————————');
}

module.exports.debug = function() {
	if(!debug) return;
	var s = '\tInfo: ';
	var e;
	for (var i = 0; i < arguments.length; i++) {
		e = arguments[i];
		s += ((e instanceof Object) ? JSON.stringify(e) : e)+' ';
	}
	console.log(s.debug);
}

module.exports.logError = function(err, detail) {
	var s = '\tError: '.error;// @ '+(new Date()) + '\n';
	// console.log('\tError:'.error, err);
	// s += __line + __function;



	for (var i = 0; i < arguments.length; i++) {
		e = arguments[i];
		s += ((e instanceof Object) ? JSON.stringify(e) : ''+e).bold.error;
	}
  // var f = ('\t'+arguments.callee)//.replace('\n', '\n\t');
  // s += '\n'+ f;
  // console.log
  // console.trace();

	// if (detail) {
	// 	if (detail instanceof Object) detail = JSON.stringify(detail);		
	// 	s += ('\t' + err + '\n\t' + detail + '\n\n');
	// } else {
	// 	s += ('\t' + err + '\n\n');
	// }
  var pattern = "/Users/joelsimon/Projects/Beacon/";
  // re = new RegExp(pattern, "g");
  var stackTrace = getStackTrace().replace(/    /g, '\t')
  stackTrace = stackTrace.replaceAll(pattern, '');
  // stackTrace = stackTrace.replace(re, '');
  
	s += ('\n\t'+stackTrace.error+'\n');
  console.log(s);
 //  fs.appendFile("./err.txt", s, function(err2) {
 //    if(err2) {
 //      console.log(err2);
 //    }
	// }); 
}
function getStackTrace() {
  var obj = {};
  Error.captureStackTrace(obj, getStackTrace);
  return obj.stack;
}



module.exports.isSubset = function(a, b) {
	if (a.length > b.length) return false;
	a.sort();
	b.sort();
	for (var i = 0; i < a.length; i++) {
		if (binaryIndexOf(b, a[i]) < 0) return false;
	}
	return true;
}
function binaryIndexOf(arr, e) {
  var minIndex = 0;
  var maxIndex = arr.length - 1;
  var currentIndex;
  var currentElement;

  while (minIndex <= maxIndex) {
    currentIndex = (minIndex + maxIndex) / 2 | 0;
    currentElement = arr[currentIndex];
    if (currentElement < e) minIndex = currentIndex + 1;
    else if (currentElement > e) maxIndex = currentIndex - 1;
    else return currentIndex;
  }

  return -1;
}

Object.defineProperty(global, '__stack', {
get: function() {
      var orig = Error.prepareStackTrace;
      Error.prepareStackTrace = function(_, stack) {
          return stack;
      };
      var err = new Error;
      Error.captureStackTrace(err, arguments.callee);
      var stack = err.stack;
      Error.prepareStackTrace = orig;
      return stack;
  }
});

Object.defineProperty(global, '__line', {
get: function() {
        return __stack[1].getLineNumber();
    }
});

Object.defineProperty(global, '__function', {
get: function() {
        return __stack[1].getFunctionName();
    }
});


String.prototype.replaceAll = function(str1, str2, ignore) 
{
  return this.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g,"\\$&"),(ignore?"gi":"g")),(typeof(str2)=="string")?str2.replace(/\$/g,"$$$$"):str2);
}
