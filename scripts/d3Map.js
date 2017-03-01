(function ($, undefined) {
    var $ = jQuery;

    $.widget('d3svg.d3Map', {

        options: {
            mapjson: null, // map json file
            percentOfView: 0.8
        },
        getD3Svg: function() {
            return this.svg;
        },
        getProjection: function()
        {
            return this.projection;
        },
        _create: function () {
            var self = this;
            $.getScript(self.options.mapjson, function () {

                self._initView();
                self._showMap();

                self._addZoomSlider();
                self._addZoomButtons();
                self._addCompass();

                self.options.asyncDone();
            });
        },
        _initView: function () {
            var self = this;
            var _this = self.element;
            var viewSize = self._getClientViewSize();
            var width = viewSize.width * self.options.percentOfView;
            var height = viewSize.height * self.options.percentOfView;

            self.svg = d3.select(_this[0])
                .append('svg')
                .attr('width', width)
                .attr('height', height);

            self.map = self.svg.append('g').classed('d3svg-map', true);

            var zoomed = function () {
                self.currTranslate = d3.event.translate;
                self.currScale = d3.event.scale;

                if (self.map) {
                    self.svg.selectAll('g').attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
                    self.svg.selectAll('g').style("stroke-width", 1 / d3.event.scale + "px");
                    self.svg.selectAll('text').attr("font-size", 0.005/d3.event.scale + "px");
                }

                self.element.find('.d3svg-mapSilder').slider("value", self.currScale);
            }

            self.zoom = d3.behavior.zoom()
                .scaleExtent([1, 100])
                .on("zoom", zoomed);
            self.zoom(self.svg);

            // create projection based on the view width and height
            self.projection = self._getProjectionBySize(width, height);
            // create path generator
            self.path = d3.geo.path().projection(self.projection);
            self.path.pointRadius(1.6);
        },
        _showMap: function () {
            var self = this;
            self.svg.select('g.d3svg-map')
                .selectAll('path')
                .data(topojson.feature(d3svg_world, d3svg_world.objects.world_countries).features)
                .enter()
                .append('path')
                .attr("d", self.path)
                .style('fill', 'lightblue')
                .style('stroke', 'white')
                .style('stroke-width', 1);

            self.svg.select('g.d3svg-map')
                .selectAll(".d3svg-countryname")
                .data(topojson.feature(d3svg_world, d3svg_world.objects.world_countries).features)
                .enter().append("text")
                .attr("class", "d3svg-countryname")
                .attr("transform", function(d) {
                    return "translate(" + self.path.centroid(d) + ")"; 
                })
                .attr("dy", function(d){
                    if (d.properties.name == 'United States')
                        return 40;
                    
                    if (d.properties.name == "Canada")
                        return 50;

                    return 5;
                })
                .attr("dx", function(d){
                    if (d.properties.name == 'United States')
                        return 30;
                    
                    if (d.properties.name == "Canada")
                        return -30;

                    return -10;
                })
                .text(function(d) { return d.properties.name; });
        },       
        _addZoomSlider: function () {
            var self = this;
            var _this = self.element;
            self.mapSlider = $("<div class='d3svg-mapSilder'></div>").appendTo(_this);
            self.mapSlider.slider({
                orientation: "vertical",
                min: 1,
                max: 10,
                step: 0.1,
                slide: function (event, ui) {
                    self._sliderZoom(ui.value);
                }
            });
        },
        _sliderZoom: function (value) {
            var self = this;
            if (self.map) {
                self.currTranslate = [-600 * (value - 1), -300 * (value - 1)];
                self.currScale = value;

                self.zoom.scale(self.currScale);
                self.zoom.translate(self.currTranslate);

                self.svg.selectAll('g').attr("transform", "translate(" + self.currTranslate + ")scale(" + value + ")");
                self.map.style("stroke-width", 1 / value + "px");
            }
        },
        _addZoomButtons: function () {
            var self = this;
            var _this = self.element;
            $("<img src='img/plus.png' class='d3svg-plus'/>")
                .appendTo(_this)
                .click(function () {
                    var zv = self.mapSlider.slider("value") + 0.1;
                    if (zv <= 10) {
                        self.mapSlider.slider("value", zv);
                        self._sliderZoom(zv)
                    }
                });
            $("<img src='img/minus.png' class='d3svg-minus' />")
                .appendTo(self.element)
                .click(function () {
                    var zv = self.mapSlider.slider("value") - 0.1;
                    if (zv >= 1) {
                        self.mapSlider.slider("value", zv);
                        self._sliderZoom(zv)
                    }
                });
        },
        _addCompass: function () {
            var self = this;
            var _this = self.element;
            $("<img class='d3svg-Compass' alt='' src='img/compass.png' usemap='#compass'/>")
                .appendTo(_this);
            var compass = $("<map name='compass'>")
                .appendTo(self.element);
            $("<area shape='poly' coords='0,0,37,38,72,0'>").click(function () { self._compassClicked(1) }).appendTo(compass);
            $("<area shape='poly' coords='0,0,37,38,0,71'>").click(function () { self._compassClicked(2) }).appendTo(compass);
            $("<area shape='poly' coords='37,38,0,71,73,71'>").click(function () { self._compassClicked(3) }).appendTo(compass);
            $("<area shape='poly' coords='72,0,37,38,73,71'>").click(function () { self._compassClicked(4) }).appendTo(compass);
        },
        _compassClicked: function (dir) {
            var self = this;
            if (self.map) {
                if (dir == 1)
                    self.currTranslate = [self.currTranslate[0], self.currTranslate[1] + 10];
                if (dir == 2)
                    self.currTranslate = [self.currTranslate[0] + 10, self.currTranslate[1]];
                if (dir == 3)
                    self.currTranslate = [self.currTranslate[0], self.currTranslate[1] - 10];
                if (dir == 4)
                    self.currTranslate = [self.currTranslate[0] - 10, self.currTranslate[1]];
                self.map.attr("transform", "translate(" + self.currTranslate + ")scale(" + self.currScale + ")");
            }
        },
        _getClientViewSize: function () {
            var w = window, d = document.documentElement, b = document.getElementsByTagName("body")[0];
            width = w.innerWidth || d.clientWidth || b.clientWidth;
            height = w.innerHeight || d.clientHeight || b.clientHeight;
            return { 'width': width, 'height': height };
        },

        /**
         * Returns a d3 Albers conical projection (en.wikipedia.org/wiki/Albers_projection) that maps the bounding box
         * defined by the lower left geographic coordinates (lng0, lat0) and upper right coordinates (lng1, lat1) onto
         * the view port having (0, 0) as the upper left point and (width, height) as the lower right point.
         */
        _getProjectionBySize: function (width, height) {
            var self = this;
            // The default scale is 1070. Must scale it back to 1 in order to re-scale the map according to the view port size
            var projection = d3.geo.mercator().scale(1);
            // Just pick random locations will be fine since everything will be proportional
            var Miami = [-80.200195, 25.78629];
            var Seattle = [-122.336197, 47.610792];
            // Project the two longitude/latitude points into pixel space. These will be tiny because scale is 1.
            var p0 = projection(Seattle);
            var p1 = projection(Miami);
            // The actual scale is the ratio between the size of the bounding box in pixels and the size of the view port.
            // Reduce by 30% since the locations are random
            var s = 1 / Math.max((p1[0] - p0[0]) / width, (p1[1] - p0[1]) / height) * 0.3;
            // Move the center in pixel space.
            var t = [width / 4, height / 3];

            // Scale and Translate
            return projection.scale(s).translate(t);
        }
    });
})(jQuery);