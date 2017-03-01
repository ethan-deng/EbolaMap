(function ($, undefined) {
    var $ = jQuery;
    $.widget('d3svg.barChart', {

        options: {
            width: 600,
            height: 400,
            data: null,
            topPadding: 40,
            rightPadding: 40,
            bottomPadding: 60,
            leftPadding: 50,
            colorRange: ['pink', 'darkred'],
            xAxisScale: null
        },
        svg: null,

        _getKey: function(d){
            return d.key;
        },

        _getValue: function(d){
            return d.value;
        },

        _create: function () {
            var self = this;
            var _this = this.element;

            self.svg = d3.select(_this[0]).append('svg')
                .attr('width', self.options.width)
                .attr('height', self.options.height);

            var d3Helper = self.getD3Helper();

            self.svg.selectAll('rect')
                    .data(self.options.data, this._getKey)
                    .enter()
                    .append('rect')
                    .attr(
                    {
                        'class': 'bar',
                        'x': function (d, i) {
                            return d3Helper.xScale(i) + self.options.leftPadding;
                        },
                        'y': function (d) {
                            return self.options.height - d3Helper.yScale(d.value) - self.options.bottomPadding;
                        },
                        'width': d3Helper.xScale.rangeBand(),
                        'height': function (d) {
                            return d3Helper.yScale(d.value);
                        },
                        'fill': function (d) {
                            return d3Helper.colorScale(d.value);
                        }
                    })
                    .on('mouseover', function (d) {
                        //Get this bar's x/y values, then augment for the tooltip
                        var xPosition = parseFloat(d3.select(this).attr("x")) + d3Helper.xScale.rangeBand() / 2;
                        var yPosition = parseFloat(d3.select(this).attr("y")) / 2 + self.options.height / 2;

                        //Create the barinfo label
                        var tooltip = d3.select('body').append('div') // self.svg.append('div')
                          .attr("id", "barinfo")
                          .style("left", xPosition + "px")
                          .style("top", yPosition + "px")
                          .style('position', 'absolute')
                          .style('color', 'yellow');

                        tooltip.html("<span id='value'></span>");
                        tooltip.select("#value").text(d.value);
                    })
                .on('mouseout', function (d) {
                    //Remove the tooltip
                    d3.select("#barinfo").remove();
                });

            d3Helper.xAxis(self.svg.append('g')
                .attr('class', 'x axis')
                .attr("transform", "translate(" + self.options.leftPadding + "," + (self.options.height - self.options.bottomPadding) + ")"));

            d3Helper.yAxis(self.svg.append('g')
                .attr('class', 'y axis')
                .attr("transform", "translate(" + self.options.leftPadding + ", 0)"));

            self.svg.selectAll(".x.axis text")
                .attr("transform", function (d) {
                    return "translate(" + this.getBBox().height * -2 + "," + this.getBBox().height * 2 + ")rotate(-45)";
                });
        },
        refresh: function () {
            var self = this;
            var d3Helper = self.getD3Helper();

            var bars = self.svg.selectAll('.bar')
                .data(this.options.data, this._getKey);

            bars.transition()
                .duration(1000)
                .attr(
                {
                    'x': function (d, i) {
                        return d3Helper.xScale(i) + self.options.leftPadding;
                    },
                    'y': function (d) {
                        return self.options.height - d3Helper.yScale(d.value) - self.options.bottomPadding;
                    },
                    'width': d3Helper.xScale.rangeBand(),
                    'height': function (d) {
                        return d3Helper.yScale(d.value);
                    },
                    'fill': function (d) {
                        return d3Helper.colorScale(d.value);
                    }
                })

            bars.enter()
                .append('rect')
                .attr(
                {
                    'class': 'bar',
                    'x': function (d, i) {
                        return d3Helper.xScale(i) + self.options.leftPadding;
                    },
                    'y': function (d) {
                        return self.options.height - d3Helper.yScale(d.value) - self.options.bottomPadding;
                    },
                    'width': d3Helper.xScale.rangeBand(),
                    'height': function (d) { return d3Helper.yScale(d.value); },
                    'fill': function (d) {
                        return d3Helper.colorScale(d.value);
                    }
                });

            //Update x-axis
            //self.xAxisScale.domain([0, self.options.data.length]);
            //self.xAxis(self.svg.select(".x.axis")
            //    .transition()
            //    .duration(1000));

            //Update y-axis
            d3Helper.yAxis(self.svg.select(".y.axis")
                .transition()
                .duration(1000));
        },
        highlight: function(key){
            var self = this;
            var d3Helper = self.getD3Helper();

            var bars = self.svg.selectAll('.bar')
                .data(this.options.data, this._getKey);

            bars.attr(
                {
                    'x': function (d, i) {
                        return d3Helper.xScale(i) + self.options.leftPadding;
                    },
                    'y': function (d) {
                        return self.options.height - d3Helper.yScale(d.value) - self.options.bottomPadding;
                    },
                    'width': function(d){
                        if (d.key === key)
                            return d3Helper.xScale.rangeBand() * 1;
                        else
                            return d3Helper.xScale.rangeBand()
                    },
                    'height': function (d) {
                        return d3Helper.yScale(d.value);
                    },
                    'fill': function (d) {
                        if (d.key === key)
                            return 'red';
                        else
                            return d3Helper.colorScale(d.value);
                    }
                })
        },
        getD3Helper: function(){
            var self = this;
            var maxValue = d3.max(self.options.data, this._getValue);
            var helper = {};

            helper.colorScale = d3.scale.linear()
                .domain([0, maxValue])
                .range(self.options.colorRange);

            helper.xAxisScale = this.options.xAxisScale ? this.options.xAxisScale :
                d3.scale.linear()
                    .domain(self.options.xAxisDomain)
                    .range([0, self.options.width - self.options.leftPadding - self.options.rightPadding]);

            helper.yAxisScale = d3.scale.linear()
                    .domain([0, maxValue])
                    .range([self.options.height - self.options.bottomPadding, self.options.topPadding]);

            helper.xAxis = d3.svg.axis()
                    .scale(helper.xAxisScale)
                    .orient('bottom')
                    .ticks(d3.time.months, 1);

            helper.yAxis = d3.svg.axis()
                    .scale(helper.yAxisScale)
                    .orient("left");

            helper.xScale = d3.scale.ordinal()
                    .domain(d3.range(self.options.data.length))
                    .rangeBands([10, self.options.width - self.options.leftPadding - self.options.rightPadding -20 ], 0.3, 0.2);

            helper.yScale = d3.scale.linear()
                    .domain([0, maxValue])
                    .range([0, self.options.height - self.options.topPadding - self.options.bottomPadding]);

            return helper;
        },
    });
})(jQuery);
