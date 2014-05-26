GS.FontLoader = function() {
	this.fontPath = "";
};

GS.FontLoader.prototype = {
	constructor: GS.FontLoader,

	load: function(name, filename, callback) {
		var that = this;
		var path = this.fontPath + filename;

		$("head").prepend([
				"<style type='text/css'>",
					"@font-face {",
						"font-family: '" + name + "';",
						"src: url('" + path + "') format('woff');",
						"font-weight: normal;",
						"font-style: normal;",
					"}",
				"</style>",
			].join("\n"));

		// http://stackoverflow.com/a/11689060/3640489
		var node = document.createElement("span");
		node.innerHTML = "giItT1WQy@!-/#";
		node.style.position = "absolute";
		node.style.left = "-10000px";
		node.style.top = "-10000px";
		node.style.fontSize = "300px";
		node.style.fontFamily = "sans-serif";
		node.style.fontVariant = "normal";
		node.style.fontStyle = "normal";
		node.style.fontWeight = "normal";
		node.style.letterSpacing = "0";
		document.body.appendChild(node);

		var width = node.offsetWidth;
		node.style.fontFamily = name;

		var intervalId = setInterval(function() {
			if (node.offsetWidth != width) {
				node.parentNode.removeChild(node);
				clearInterval(intervalId);
				callback();
			}
		}, 50);
	},
};