angular.module('app.directives.format',[])
.directive('format', ['$filter', function ($filter) {
    return {
        require: '?ngModel',
        link: function (scope, elem, attrs, ctrl) {
            if (!ctrl) return;

            var format = {
                    prefix: '',
                    centsSeparator: '.',
                    thousandsSeparator: ',',
                    limit: 4,
                    centsLimit: 2
                };
            
            ctrl.$parsers.unshift(function (value) {
                elem.priceFormat(format);
                //console.log('parsers', elem[0].value);
                return elem[0].value;
            });

            ctrl.$formatters.unshift(function (value) {
                var price = (ctrl.$modelValue * 100).toFixed(0);
                elem[0].value = price;
                elem.priceFormat(format);
                //console.log('formatters', elem[0].value);
                return elem[0].value ;
            })
        }
    };
}]);
angular.module('app.directives.clickToEdit',[])
.directive('clickToEdit', function($ionicPopup, $rootScope, $timeout) {
    return {
        restrict: "E",
        replace: true,
        templateUrl: "templates/directives/editPrice.html",
        scope: {
            price: "=",
            name: "=",
            confirm: "=",
            updated: "=",
            index: "=",
            storeid: "=",
            confirmedby: "="
        },
        controller: function($scope) {
            //console.log($scope.price);
            $scope.view = {
                editableValue: $scope.price,
                editorEnabled: false
            };

            $scope.now = new Date().getTime();
            $scope.Math = window.Math;
            $scope.moment = window.moment;

            //$scope.updated = Math.round(moment.duration(new Date().getTime() - $scope.updated).asHours());

            $scope.enableEditor = function() {
                $scope.view.editorEnabled = true;
                $scope.view.editableValue = $scope.price;
                $scope.shouldBeOpen = true;
            };

            $scope.disableEditor = function() {
                $scope.view.editorEnabled = false;
                $scope.shouldBeOpen = false;
            };

            $scope.addConfirm = function() {
                if($scope.$root.user == null){
                    $ionicPopup.alert({
                        title: 'Please login First',
                        template: 'You can earn 1 point for every price you confirm.'
                    });
                } else {
                    if($scope.confirmedby != $scope.$root.user.uid){
                        //Increment the # of confirms
                        $rootScope.storesRef.child('stores/'+$scope.storeid+'/cuts/'+$scope.name+'/confirm').transaction(function (current_value) {
                            return (current_value || 0) + 1;
                        });
                        //Set confirmedby
                        $rootScope.storesRef.child('stores/'+$scope.storeid+'/cuts/'+$scope.name+'/confirmedBy').transaction(function () {
                            return $scope.$root.user.uid;
                        });
                        //Give the guy a point
                        $rootScope.usersRef.child($scope.$root.user.uid+'/total_points').transaction(function (current_value) {
                            return (current_value || 0) + 1;
                        });
                        //Add point history
                        $rootScope.firebaseRef.child('pointHistory/'+$scope.$root.user.uid).push({
                            date: new Date().getTime(), 
                            action:'Confirm', 
                            value: 1
                        });
                        //Increment Edits
                        $rootScope.usersRef.child($scope.$root.user.uid+'/confirms').transaction(function (current_value) {
                            return (current_value || 0) + 1;
                        });
                        $ionicPopup.alert({
                            title: 'Thank You!',
                            template: 'You earned 1 point for confirming this price. Keep it up and you will be raking in the rewards.'
                        });
                    } else {

                        var alertPopup = $ionicPopup.alert({
                            title: 'You already confirmed price',
                            template: 'You can only confirm a price once, try confirming another price to get more points.'
                        });
                        alertPopup.then(function(res) {
                            console.log('Price Already confirmed');
                        });

                    }
                }

            };
            $scope.save = function() {
                $scope.disableEditor();
                if($scope.price == $scope.view.editableValue){
                    var popup = $ionicPopup.alert({
                        title: 'Same Price',
                        template: 'You can still Confirm it for 1 point'
                    });
                } else {
                    //Add old price to history
                    $rootScope.firebaseRef.child('priceHistory/'+$scope.storeid+'/'+$scope.name).push({
                        confirm: $scope.confirm,
                        confirmedBy: $scope.confirmedby,
                        price: $scope.price,
                        updated: $scope.updated
                    });
                    $scope.price = $scope.view.editableValue;
                    var text;
                    var currentUser;
                    if($scope.$root.user == null){
                        text = 'You could have earned 2 points if you had an account. Navigate to the Profile tab on the left to set one up';
                        currentUser = '';
                    } else {
                        text = 'You earned 2 points! Keep it up and you will be raking in the rewards.';
                        currentUser = $scope.$root.user.uid;

                        //Add point history
                        $rootScope.firebaseRef.child('pointHistory/'+$scope.$root.user.uid).push({
                            date: new Date().getTime(), 
                            action:'Edit', 
                            value: 2
                        });

                        //Increment Total Points
                        $rootScope.usersRef.child($scope.$root.user.uid+'/total_points').transaction(function (current_value) {
                            return (current_value || 0) + 2;
                        });
                        //Increment Edits
                        $rootScope.usersRef.child($scope.$root.user.uid+'/edits').transaction(function (current_value) {
                            return (current_value || 0) + 1;
                        });
                    }
                    var popup = $ionicPopup.alert({
                        title: 'Thanks for contributing!',
                        template: text
                    });
                    //Change the price in the root scope since it is static
                    $scope.$root.stores[$scope.index].cuts[$scope.name].price = $scope.view.editableValue;
                    //Change the price in the store object
                    $rootScope.storesRef.child('stores/'+$scope.storeid+'/cuts/'+$scope.name).update({
                        confirm: 1,
                        confirmedBy: currentUser,
                        price: $scope.view.editableValue,
                        updated: new Date().getTime()
                    });

                }

            };

        }
    };
});

angular.module('app.directives.focusMe',[]).directive('focusMe', function($timeout) {
  return {
    link: function(scope, element, attrs) {
      scope.$watch(attrs.focusMe, function(value) {
        if(value === true) { 
          console.log('value=',value);
          $timeout(function() {
            element[0].focus();
            scope[attrs.focusMe] = false;
          });
        }
      });
    }
  };
});
