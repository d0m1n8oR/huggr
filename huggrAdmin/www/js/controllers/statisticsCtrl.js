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
        end: null
    };

    //check why this is not working
    $scope.$watch('$scope.date', function() {
        console.log("hallo: " + $scope.date.start);
    }, true);

    $scope.setToNow = function() {
        $scope.date.end = new Date(Date.now());
    }



    $scope.calcStats = function() {
        if ($scope.date.end != null && $scope.date.end.getTime() <= Date.now()) {
            console.log("hallo2" + $scope.date.start);
            var end = $scope.date.end.getTime();

            var array = {
                value: []
            }

            var label = new Array(7)

            var sumArray = new Array(0, 0, 0, 0, 0, 0, 0);

            function load() {
                var deferred = $q.defer()

                for (i = 1; i < 8; i++) {
                    array.value.push({
                        start: (end - (1000 * 60 * 60 * 24 * i)),
                        end: (end - (1000 * 60 * 60 * 24 * (i - 1)))
                    });
                    var date = new Date((end - (1000 * 60 * 60 * 24 * (i-1))));
                    label[6-i+1] = date.getDate() + "-" + (date.getMonth()+1) + "-" + date.getFullYear();
                }

                console.log(array);
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
                    deferred.resolve(sumArray);
                })

                return deferred.promise;
            }
            load().then(function(data) {
                console.log(data);

                var lineData = {
                    labels: label,
                    datasets: [{
                        label: "My First dataset",
                        fillColor: "rgba(220,220,220,0.2)",
                        strokeColor: "rgba(220,220,220,1)",
                        pointColor: "rgba(220,220,220,1)",
                        pointStrokeColor: "#fff",
                        pointHighlightFill: "#fff",
                        pointHighlightStroke: "rgba(220,220,220,1)",
                        data: data
                    }]
                };

                var ctx = document.getElementById("myChart").getContext("2d");
                var myLineChart = new Chart(ctx).Line(lineData);
            })
        } else {
            console.log("error");
        }



    }
})