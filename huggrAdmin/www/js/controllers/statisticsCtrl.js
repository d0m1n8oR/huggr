.controller('statisticsCtrl', function($scope, $firebase, $q) {
    var ref = new Firebase("https://huggr.firebaseio.com/");


    $scope.legend = {
        stats: null,
        gender: null,
        status: null
    }

    $scope.date = {
        start: null,
        end: null,
        dimension: null
    };

    //check why this is not working
    $scope.$watch('$scope.date', function() {}, true);

    $scope.setToNow = function() {
        $scope.date.end = new Date(Date.now());
    }

    $scope.callStats = function() {
        if ($scope.date.end != null && $scope.date.end.getTime() <= Date.now()) {
            var end = $scope.date.end.getTime();
            var dimension;
            if ($scope.date.dimension == "Month") {
                dimension = 30;
            } else if ($scope.date.dimension == "Week") {
                dimension = 7;
            } else {
                dimension = 1;
            }
            $scope.calcStats(end, dimension);
        } else {
            //console.log("error");
        }
    }

    $scope.calcStats = function(end, dimension) {

        var array = {
            value: []
        }

        var label = new Array(7)

        var sumArray = new Array(0, 0, 0, 0, 0, 0, 0);
        var sumArray2 = new Array(0, 0, 0, 0, 0, 0, 0);

        function load() {
            var deferred = $q.defer()

            for (i = 1; i < 8; i++) {
                array.value.push({
                    start: (end - (1000 * 60 * 60 * 24 * i * dimension)),
                    end: (end - (1000 * 60 * 60 * 24 * (i - 1) * dimension))
                });
                var date = new Date((end - (1000 * 60 * 60 * 24 * (i - 1) * dimension)));
                label[6 - i + 1] = date.getDate() + "-" + (date.getMonth() + 1) + "-" + date.getFullYear();
            }

            $scope.statRef = $firebase(ref.child("hugg").orderByChild('reqTime').startAt(array.value[6].start).endAt(array.value[0].end)).$asObject();
            $scope.statRef.$loaded().then(function(data) {
                for (var key in data) {
                    if (data.hasOwnProperty(key) && key != "$$conf" && key != "$id" && key != "$priority" && key != "$value") {
                        if (data[key].reqTime < array.value[6].end) {
                            sumArray[0] = sumArray[0] + 1;
                        } else if (data[key].reqTime < array.value[5].end) {
                            sumArray[1] = sumArray[1] + 1;
                        } else if (data[key].reqTime < array.value[4].end) {
                            sumArray[2] = sumArray[2] + 1;
                        } else if (data[key].reqTime < array.value[3].end) {
                            sumArray[3] = sumArray[3] + 1;
                        } else if (data[key].reqTime < array.value[2].end) {
                            sumArray[4] = sumArray[4] + 1;
                        } else if (data[key].reqTime < array.value[1].end) {
                            sumArray[5] = sumArray[5] + 1;
                        } else {
                            sumArray[6] = sumArray[6] + 1;
                        }
                    }
                }

                $scope.statRef = $firebase(ref.child("users").child("data").orderByChild('registerTime').startAt(array.value[6].start).endAt(array.value[0].end)).$asObject();
                $scope.statRef.$loaded().then(function(data) {
                    for (var key in data) {
                        if (data.hasOwnProperty(key) && key != "$$conf" && key != "$id" && key != "$priority" && key != "$value") {
                            if (data[key].reqTime < array.value[6].end) {
                                sumArray2[0] = sumArray2[0] + 1;
                            } else if (data[key].reqTime < array.value[5].end) {
                                sumArray2[1] = sumArray2[1] + 1;
                            } else if (data[key].reqTime < array.value[4].end) {
                                sumArray2[2] = sumArray2[2] + 1;
                            } else if (data[key].reqTime < array.value[3].end) {
                                sumArray2[3] = sumArray2[3] + 1;
                            } else if (data[key].reqTime < array.value[2].end) {
                                sumArray2[4] = sumArray2[4] + 1;
                            } else if (data[key].reqTime < array.value[1].end) {
                                sumArray2[5] = sumArray2[5] + 1;
                            } else {
                                sumArray2[6] = sumArray2[6] + 1;
                            }
                        }
                    }
                    var ret = {
                        sumArray: sumArray,
                        sumArray2: sumArray2
                    };
                    deferred.resolve(ret);
                });

            });

            return deferred.promise;
        }
        load().then(function(data) {

            var lineData = {
                labels: label,
                datasets: [{
                    label: "Huggs",
                    fillColor: "rgba(220,220,220,0.2)",
                    strokeColor: "rgba(220,220,220,1)",
                    pointColor: "rgba(220,220,220,1)",
                    pointStrokeColor: "#fff",
                    pointHighlightFill: "#fff",
                    pointHighlightStroke: "rgba(220,220,220,1)",
                    data: data.sumArray
                }, {
                    label: "Registered users",
                    fillColor: "rgba(151,187,205,0.2)",
                    strokeColor: "rgba(151,187,205,1)",
                    pointColor: "rgba(151,187,205,1)",
                    pointStrokeColor: "#fff",
                    pointHighlightFill: "#fff",
                    pointHighlightStroke: "rgba(151,187,205,1)",
                    data: data.sumArray2
                }]

            };

            var ctx = document.getElementById("analysis").getContext("2d");
            var analysisChart = new Chart(ctx).Line(lineData);
        })
    }

    $scope.calcGender = function() {

        var genderArray = new Array(0, 0);

        function load() {
            var deferred = $q.defer()

            $scope.statRef = $firebase(ref.child("users").child("data").orderByChild('gender')).$asObject();
            $scope.statRef.$loaded().then(function(data) {
                for (var key in data) {
                    if (data.hasOwnProperty(key) && key != "$$conf" && key != "$id" && key != "$priority" && key != "$value") {
                        if (data[key].gender == "male") {
                            genderArray[0] = genderArray[0] + 1;
                        } else {
                            genderArray[1] = genderArray[1] + 1;
                        }
                    }
                }
                deferred.resolve(genderArray);
            });
            return deferred.promise;
        }


        load().then(function(data) {

            var dData = [{
                value: data[0],
                color: "#F7464A",
                highlight: "#FF5A5E",
                label: "Male"
            }, {
                value: data[1],
                color: "#46BFBD",
                highlight: "#5AD3D1",
                label: "Female"
            }]

            var ctx = document.getElementById("gender").getContext("2d");
            var genderChart = new Chart(ctx).Doughnut(dData);
        })
    }

    $scope.calcStatus = function() {

        var statusArray = new Array(0, 0, 0, 0);

        function load() {
            var deferred = $q.defer()

            $scope.statRef = $firebase(ref.child("hugg")).$asObject();
            $scope.statRef.$loaded().then(function(data) {
                for (var key in data) {
                    if (data.hasOwnProperty(key) && key != "$$conf" && key != "$id" && key != "$priority" && key != "$value") {
                        if (data[key].answered == "0") {
                            statusArray[0] = statusArray[0] + 1;
                        } else if (data[key].answered == "1" && data[key].accepted == "0") {
                            statusArray[1] = statusArray[1] + 1;
                        } else if (data[key].accepted == "1" && data[key].done == "0") {
                            statusArray[2] = statusArray[2] + 1;
                        } else {
                            statusArray[3] = statusArray[3] + 1;
                        }
                    }
                }
                deferred.resolve(statusArray);
            });
            return deferred.promise;
        }


        load().then(function(data) {

            var dData = [{
                value: data[0],
                color: "#F7464A",
                highlight: "#FF5A5E",
                label: "Unanswered"
            }, {
                value: data[1],
                color: "#46BFBD",
                highlight: "#5AD3D1",
                label: "Answered"
            }, {
                value: data[2],
                color: "#FDB45C",
                highlight: "#FFC870",
                label: "Accepted"
            }, {
                value: data[3],
                color: "#4D5360",
                highlight: "#616774",
                label: "Done"
            }]

            var ctx = document.getElementById("status").getContext("2d");
            var statusChart = new Chart(ctx).Doughnut(dData);
        })
    }
})