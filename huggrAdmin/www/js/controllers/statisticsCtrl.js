.controller('statisticsCtrl', function($scope, $cordovaGeolocation, $ionicPopover, $state, localstorage, $firebase, toast, notifications, $q) {
    var ref = new Firebase("https://huggr.firebaseio.com/");

    $scope.statistics = {
        huggNumber: null,
        userNumber: null,
        chatNumber: null,
        chatMessages: null,
        connected: null
    }

    $scope.getStats = function() {

        $scope.statistics.chatMessages = null;

        var huggObject = $firebase(ref.child("hugg")).$asObject();
        huggObject.$loaded().then(function(obj) {
            $scope.statistics.huggNumber = Object.keys(obj).length - 3;
        });

        var userObject = $firebase(ref.child("users").child("data")).$asObject();
        userObject.$loaded().then(function(obj) {
            $scope.statistics.userNumber = Object.keys(obj).length - 3;
        })

        var chatObject = $firebase(ref.child("chat")).$asObject();
        chatObject.$loaded().then(function(obj) {
            $scope.statistics.chatNumber = Object.keys(obj).length - 3;
            var i = 0;

            for (var key in obj) {
                if (obj.hasOwnProperty(key) && key != "$$conf" && key != "$id" && key != "$priority" && obj[key].message != null) {
                    $scope.statistics.chatMessages = $scope.statistics.chatMessages + Object.keys(obj[key].message).length;
                }
            }

        })

    }



    $scope.connection = function() {
        var connectedRef = new Firebase("https://huggr.firebaseio.com/.info/connected");
        connectedRef.on("value", function(snap) {
            if (snap.val() === true) {
                $scope.statistics.connected = true;

            } else {
                $scope.statistics.connected = false;
            }
        });
    }
    $scope.connection();

    $scope.getStats();


    $scope.date = {
        start: null,
        end: null,
        dimension: null
    };

    //check why this is not working
    $scope.$watch('$scope.date', function() {
        console.log("hallo: " + $scope.date.start);
    }, true);

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
            console.log("error");
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
                //console.log(data);
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
                    //console.log(data);
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
            console.log(data);

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

            var ctx = document.getElementById("myChart").getContext("2d");
            var myLineChart = new Chart(ctx).Line(lineData);
        })
    }
    
    
    $scope.initGraph = function() {
        var date = Date.now();
        var dimension = 1;
        $scope.calcStats(date, dimension);
    };
    
    $scope.initGraph();
})