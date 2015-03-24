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
                elem[0].value = ctrl.$modelValue * 100 ;
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
            storeid: "="
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
                    if($scope.$parent.$parent.$parent.store.cuts[$scope.name].confirmedBy != $scope.$root.user.id){
                        $scope.confirm++
                        $scope.$parent.$parent.$parent.store.cuts[$scope.name].confirm = $scope.confirm;
                        $scope.$parent.$parent.$parent.store.cuts[$scope.name].confirmedBy = $scope.$root.user.id;
                        $scope.$parent.$parent.$parent.store.$save('cuts');
                        $ionicPopup.alert({
                            title: 'Thank You!',
                            template: 'You earned 1 point for confirming this price. Keep it up and you will be raking in the rewards.'
                        });
                    } else {

                        var alertPopup = $ionicPopup.alert({
                            title: 'You already confirmed price',
                            template: 'Sorry but you can only confirm a price once, try confirming a new price to get more points.'
                        });
                        alertPopup.then(function(res) {
                            console.log('Price Already confirmed');
                        });

                    }
                }

            };
            $scope.save = function() {
                $scope.disableEditor();
                var text;
                if($scope.$root.user == null){
                    text = 'You could have earned 2 points if you had an account. Navigate to the Profile tab on the left to set one up';
                } else {
                    text = 'You earned 2 points! Keep it up and you will be raking in the rewards.';
                }
                var popup = $ionicPopup.alert({
                    title: 'Thanks for contributing!',
                    template: text
                });
                popup.then(function(res) {
                    $scope.$root.stores[$scope.index].cuts[$scope.name].price = $scope.view.editableValue;
                    $rootScope.storesRef.child('stores/'+$scope.storeid+'/cuts/'+$scope.name).set({
                        confirm: 1,
                        confirmedBy: '',
                        price: $scope.view.editableValue,
                        updated: new Date().getTime()
                    });
                });

                /* Old Way
                $scope.$parent.$parent.$parent.store.cuts[$scope.name].price = $scope.view.editableValue;
                $scope.$parent.$parent.$parent.store.cuts[$scope.name].updated = new Date().getTime();
                $scope.$parent.$parent.$parent.store.cuts[$scope.name].confirm = 1;
                $scope.$parent.$parent.$parent.store.$save('cuts');
                */
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
