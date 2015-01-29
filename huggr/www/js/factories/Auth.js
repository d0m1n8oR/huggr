.factory("Auth", ["$firebaseAuth", "$state",
    function($firebaseAuth, $state) {
        var ref = new Firebase("https://huggr.firebaseio.com/");
        return $firebaseAuth(ref);
    }
])