.factory("Auth", ["$firebaseAuth", "$state",
    function($firebaseAuth, $state) {
        var ref = new Firebase("https://huggr.firebaseio.com/");
        $state.go("index");
        return $firebaseAuth(ref);
    }
])