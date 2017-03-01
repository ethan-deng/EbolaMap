(function ($, undefined) {
    //fix sublime code completion
    var $ = jQuery;

    $.widget('d3svg.fullYearCalendar', {

        options: {
            year: null,
            colorRange: ['pink', 'darkred'],
            mouseOverDate: $.noop()
        },

        _create: function () {
            var self = this;
            var _this = self.element;

            var year = this.options.year? +this.options.year : new Date().getFullYear();
            var halfYear = null;

            var dateDetail = $('<div class="d3svg-dateDetail"></div>').appendTo(_this);
            
            for (var month = 1; month <= 12; month++) {

                if (month == 1 || month == 7)
                    halfYear = $('<div class="halfYear col-sm-12"></div>').appendTo(_this);

                var monthTable = $('<table class="monthTable' + ' month-' + month + ' table-striped table-bordered table-hover" ></table>').appendTo(halfYear);
                var monthRow = $('<tr><td colspan=7 class="monthRow">' + month + '/' + year + '</td></tr>').appendTo(monthTable);
                // week one
                var weekRow = $('<tr></tr>').appendTo(monthTable);
                var firstDayofWeek = new Date(year, month - 1, 1).getDay();
                var currDayOfWeek = 0;
                for (var i = 0; i < firstDayofWeek; i++) {
                    weekRow.append('<td></td>');
                    currDayOfWeek++;
                }

                var lastDayOfMonth = new Date(year, month, 0).getDate();
                for (var i = 1; i <= lastDayOfMonth; i++) {
                    if (currDayOfWeek == 7) {
                        weekRow = $('<tr></tr>').appendTo(monthTable);
                        currDayOfWeek = 0;
                    }

                    var currDateStr = month + "/" + i + "/" + year;
                    var dateId = new Date(currDateStr).getTime();
                    $('<td class="date-' + dateId + '"  >' + i + '</td>').appendTo(weekRow)
                        .data('date', currDateStr)
                        .mouseover(function (e) {
                            dateDetail.css("left", e.pageX).css("top", e.pageY);
                            var dateStr = $(this).data('date');
                            self.options.mouseOverDate(dateDetail, dateStr);                            
                        })
                        .mouseout(function (e) {
                            dateDetail.hide();
                        });
                    currDayOfWeek++;
                }

                for (var i = currDayOfWeek; i < 7; i++) {
                    $('<td></td>').appendTo(weekRow);
                }
            }
        }

    });
}(jQuery));