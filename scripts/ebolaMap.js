(function($){
    var $ = jQuery;

    $.widget('d3svg.ebolaMap', {
        _config: function(){
            var self = this;
            var _this = self.element;
            var WebHost = ""; // if files are hosted on different domain
            self.worldmapjs = WebHost + "data/world_countries_topo.js";
            self.countrytimejs = WebHost + "data/country_timeseries.js";
            self.time_country_hash = {};

            self.caseToRadiusScale = d3.scale.threshold()
                        .domain([1, 10, 100, 1000, 5000])
                        .range([2, 10, 16, 30, 40, 60]);

            self.caseToColorScale = d3.scale.linear()
                        .domain([0, 1500])
                        .range(['#FFCCCC', '#CC0000']);

            self.hotSpotData = [
                { "id": "Guinea", "display": "Guinea", "coordinates": [-10.709836, 10.446381] },
                { "id": "Liberia", "display": "Liberia", "coordinates": [-9.333861, 6.398218] },
                { "id": "SierraLeone", "display": "Sierra Leone", "coordinates": [-11.786829, 8.582597] },
                { "id": "Nigeria", "display": "Nigeria", "coordinates": [8.062222, 9.370546] },
                { "id": "Senegal", "display": "Senegal", "coordinates": [-14.483173, 14.428365] },
                { "id": "Mali", "display": "Mali", "coordinates": [-7.018336, 13.606555] },
                { "id": "UnitedStates", "display": "Dallas, US", "coordinates": [-96.804124, 32.794405] },
                { "id": "UnitedStates", "display": "New York, US", "coordinates": [-74.000279, 40.725143] },
                { "id": "Spain", "display": "Spain", "coordinates": [-3.707689, 40.425022] }
            ];

            self.rootdiv = $("<div class='d3svg-ebolaMap'></div>").appendTo(_this);

            self.map = null;
        },
        _create: function(){
            var self = this;
            var _this = self.element;
            
            self._config();

            self.rootdiv.append("<h1 class='d3svg-mapTitle'>Three Week Ebola New Case Map</h1>");
            self.createMap();

            self.datediv = $('<h2 class="d3svg-dayTitle"><span class="label label-danger">3/22/2014 Day 0</span></h2>').appendTo(self.rootdiv);
            $('<div>\
                <ul class="nav nav-tabs">\
                <li class="active"><a href="#d3svg-calendar-2014" data-toggle="tab" class="">2014</a></li>\
                <li class=""><a href="#d3svg-calendar-2015" data-toggle="tab" class="">2015</a></li>\
                </ul>\
            </div>').appendTo(self.rootdiv);

            self.calendarContent = $('<div class="tab-content"></div>').appendTo(self.rootdiv);
            
            self.createCalendar(2014, 'active');

            self.createCalendar(2015, '');


            $.getScript(self.countrytimejs, function () {

                d3.csv.parse(d3svg_countrytime, function (d) {
                    self.time_country_hash[d.Date] = d;
                    return d;
                });

                self.create3WeekNewCases();

                self.createColorizedCalendar();

                self.createCountryChart('countryChart1');

                self.createCountryChart('countryChart2');

                self.createTimeChart();
            });
        },
        createMap: function(){
            var self = this;
            self.map = self.rootdiv.d3Map({
                mapjson: self.worldmapjs,
                percentOfView: 2,
                asyncDone: function(){
                    self.mapD3Svg = self.map.d3Map("getD3Svg");
                    self.projection = self.map.d3Map("getProjection");
                    self.hotSpots = self.mapD3Svg.append('g').attr('class', 'd3svg-hotspots');
                }
            });
        },
        createCalendar: function(year, active) {
            var self = this;
            var calendar = $('<div id="d3svg-calendar-' + year + '" class="d3svg-calendar tab-pane ' + active +'"></div>').appendTo(self.calendarContent);
            var yearCalendar = calendar.fullYearCalendar({
                year: year,
                mouseOverDate: function (div, dateStr) {
                    var date_data = self.time_country_hash[dateStr];
                    if (date_data) {

                        self.datediv.find('span').text(date_data.Date+" Day " + date_data.Day);

                        var total = date_data.Cases_Guinea 
                            + date_data.Cases_Liberia 
                            + date_data.Cases_Mali 
                            + date_data.Cases_Nigeria 
                            + date_data.Cases_Senegal 
                            + date_data.Cases_SierraLeone 
                            + date_data.Cases_Spain 
                            + date_data.Cases_UnitedStates;

                        div.html("Date: " + date_data.Date + "<br/>Day: " + date_data.Day
                            + "<br/>Guinea: " + date_data.Cases_Guinea + " New Cases: " + date_data.ThreeWeekNewCase.Guinea
                            + "<br/>Liberia: " + date_data.Cases_Liberia + " New Cases: " + date_data.ThreeWeekNewCase.Liberia
                            + "<br/>Mali: " + date_data.Cases_Mali + " New Cases: " + date_data.ThreeWeekNewCase.Mali
                            + "<br/>Nigeria: " + date_data.Cases_Nigeria + " New Cases: " + date_data.ThreeWeekNewCase.Nigeria
                            + "<br/>Senegal: " + date_data.Cases_Senegal + " New Cases: " + date_data.ThreeWeekNewCase.Senegal
                            + "<br/>Sierra Leone: " + date_data.Cases_SierraLeone + " New Cases: " + date_data.ThreeWeekNewCase.SierraLeone
                            + "<br/>Spain: " + date_data.Cases_Spain + " New Cases: " + date_data.ThreeWeekNewCase.Spain
                            + "<br/>United States: " + date_data.Cases_UnitedStates + " New Cases: " + date_data.ThreeWeekNewCase.UnitedStates
                            + "<br/>Total: " + date_data.Total + " New Cases: " + date_data.ThreeWeekNewCase.Total
                            )
                            .show();

                        self.showHotSpots(dateStr);

                        self.updateChart('countryChart1', dateStr);
                        self.updateChart('countryChart2', dateStr);
                        self.highlightTimeChart(dateStr);
                    }
                    else
                        div.text('no data available').show();
                }
            });
        },
        create3WeekNewCases: function() {
            var self = this;
            for (var date in self.time_country_hash) {
                var currData = self.time_country_hash[date];
                var prevDate = new Date(date);
                prevDate.setDate(prevDate.getDate() - 21);

                var prevDateStr = (prevDate.getMonth() + 1) + "/" + prevDate.getDate() + "/" + prevDate.getFullYear();

                var prevData = self.time_country_hash[prevDateStr];
                // Use Day 0 for the first three weeks
                if (currData.Day < 21 )
                    prevData = self.time_country_hash["3/22/2014"];
                
                var newCase = self.get3WeekData(currData, prevData);
                currData["ThreeWeekNewCase"] = newCase;
            }
        },
        get3WeekData: function(currData, prevData) {
            var self = this;
            if (!currData || !prevData)
                return {};

            var currentTotal = (+currData.Cases_Guinea)
                + (+currData.Cases_Liberia)
                + (+currData.Cases_SierraLeone)
                + (+currData.Cases_Nigeria)
                + (+currData.Cases_Senegal)
                + (+currData.Cases_UnitedStates)
                + (+currData.Cases_Spain)
                + (+currData.Cases_Mali);

            currData.Total = currentTotal;

            var threeWeekBeforeTotal = (+prevData.Cases_Guinea)
                + (+prevData.Cases_Liberia)
                + (+prevData.Cases_SierraLeone)
                + (+prevData.Cases_Nigeria)
                + (+prevData.Cases_Senegal)
                + (+prevData.Cases_UnitedStates)
                + (+prevData.Cases_Spain)
                + (+prevData.Cases_Mali);

            if (currData.Day == 0){
                return {
                "Total": currentTotal,
                "Guinea": +currData.Cases_Guinea,
                "Liberia": +currData.Cases_Liberia,
                "SierraLeone": +currData.Cases_SierraLeone,
                "Nigeria": +currData.Cases_Nigeria,
                "Senegal": +currData.Cases_Senegal,
                "UnitedStates": +currData.Cases_UnitedStates,
                "Spain": +currData.Cases_Spain,
                "Mali": +currData.Cases_Mali
                }
            }

            var newCase = {
                "Total": currentTotal - threeWeekBeforeTotal,
                "Guinea": (+currData.Cases_Guinea) - (+prevData.Cases_Guinea),
                "Liberia": (+currData.Cases_Liberia) - (+prevData.Cases_Liberia),
                "SierraLeone": (+currData.Cases_SierraLeone) - (+prevData.Cases_SierraLeone),
                "Nigeria": (+currData.Cases_Nigeria) - (+prevData.Cases_Nigeria),
                "Senegal": (+currData.Cases_Senegal) - (+prevData.Cases_Senegal),
                "UnitedStates": (+currData.Cases_UnitedStates) - (+prevData.Cases_UnitedStates),
                "Spain": (+currData.Cases_Spain) - (+prevData.Cases_Spain),
                "Mali": (+currData.Cases_Mali) - (+prevData.Cases_Mali)
            };

            return newCase;
        },
        createColorizedCalendar: function() {
            var self = this;
            for (var date in self.time_country_hash) {
                var country_data = self.time_country_hash[date];
                var dateCell = $('.date-' + new Date(date).getTime());
                if (dateCell.length > 0){
                    var color = self.caseToColorScale(country_data["ThreeWeekNewCase"].Total);
                    dateCell.css('background-color', color);
                }
            }
        },
        showHotSpots: function(dateStr) {
            var self = this;
            self.hotSpots.selectAll('circle')
                .data(self.hotSpotData)
                .attr("transform", function (d) {
                    return "translate(" + self.projection(d.coordinates) + ")";
                })
                .attr("r", function (d) {
                    var currentRow = self.time_country_hash[dateStr];
                    var numOfCases = currentRow["Cases_" + d.id];
                    var radiusOfCases = self.caseToRadiusScale(numOfCases);
                    radiusOfCases = radiusOfCases * 1000 / 1440;
                    return radiusOfCases;
                })
                .enter()
                .append('circle')
                .attr("transform", function (d) {
                    return "translate(" + self.projection(d.coordinates) + ")";
                })
                .attr("r", function (d) {
                    var currentRow = self.time_country_hash[dateStr];
                    var numOfCases = +currentRow["Cases_" + d.id];
                    var radiusOfCases = self.caseToRadiusScale(numOfCases);
                    //no need to change the radius according to the zoom
                    //because the scale is applied at 'g'
                    return radiusOfCases;
                })
                .style('fill', 'red')
                .style('fill-opacity', 0.5)
        },
        createTimeChart: function(){
            var self = this;
            var dailyNewCases=[];

            var i = 0;
            for(var date in self.time_country_hash){
                var country_data = self.time_country_hash[date];
                dailyNewCases = dailyNewCases.concat({key: date, value: country_data.ThreeWeekNewCase.Total});
                i++;
            }

            self.timeChart = $('<div class="d3svg-timeChart"></div>').appendTo(self.rootdiv);
            self.timeChart.barChart({
                width: 1000,
                height: 300,
                data: dailyNewCases,
                colorRange: ['blue', 'blue'],
                xAxisScale: d3.time.scale()
                    .domain([new Date(2014, 2, 1), new Date(2014, 11, 31)])
                    .range([0, 1000])
            });
        },
        highlightTimeChart: function(date){
            var self = this;
            self.timeChart.barChart('highlight', date);
        },
        createCountryChart: function(chartName) {
            var self = this;
            var dataset = [];
            var countryList = [];
            var width = 300;

            for(var i in self.hotSpotData){
                var country = self.hotSpotData[i];
                if (chartName == 'countryChart1')                {
                    if (country.id == 'Guinea' || country.id == 'Liberia' || country.id == 'SierraLeone'){
                        countryList = countryList.concat(country.display);
                        width = 300;
                    }
                }
                if (chartName == 'countryChart2'){
                    if (country.id != 'Guinea' && country.id != 'Liberia' && country.id != 'SierraLeone')
                        countryList = countryList.concat(country.display);
                }
            }

            var countryChart = $('<div class="d3svg-' + chartName + '"></div>').appendTo(self.rootdiv);
            countryChart.barChart({
                width: width,
                height: 300,
                data: dataset,
                colorRange: ['lightblue', 'darkblue'],
                xAxisScale: d3.scale.ordinal().domain(countryList).rangePoints([0, width - 100], 2)
            });
        },
        updateChart: function(chartName, dateStr){
            var self = this;
            var _this = self.element;
            var newCaseData = [];

            var chart = _this.find('.d3svg-' + chartName);

            var date_data = self.time_country_hash[dateStr];

            for(var i in self.hotSpotData){
                var country = self.hotSpotData[i];
                if (chartName == 'countryChart1')                {
                    if (country.id == 'Guinea' || country.id == 'Liberia' || country.id == 'SierraLeone'){
                        var newCases = date_data.ThreeWeekNewCase[country.id];
                        newCaseData = newCaseData.concat({key: i, value: newCases && newCases > 0 ? newCases : 0});
                    }
                }
                if (chartName == 'countryChart2'){
                    if (country.id != 'Guinea' && country.id != 'Liberia' && country.id != 'SierraLeone'){
                        var newCases = date_data.ThreeWeekNewCase[country.id];
                        newCaseData = newCaseData.concat({key: i, value: newCases && newCases > 0 ? newCases : 0});
                    }
                }
            }

            chart.barChart('option', 'data', newCaseData);
            chart.barChart('refresh');            
        },
    });
}(jQuery));