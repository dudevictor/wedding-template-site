/**
 * Created by victor on 26/01/17.
 */

//todo refatorar. Colocar o fomrulario para ser em um controller diferente
(function () {
    var app = angular.module('appAdmin');
    app.controller("AdminController", AdminController);
    AdminController.$inject = ['$http', 'firebaseService', '$scope', '$state' , '$timeout'];
    function AdminController($http, firebaseService, $scope, $state, $timeout) {
        var ctrl = this;
        this.categoriesList = CategoriesArray;
        this.loading = true;
        this.search = "";
        this.newStore = {};
        this.logout = logout;
        this.clickItem = clickItem;
        this.addNewStore = addNewStore;
        this.submit = submit;
        this.selectedProductContainsCategory = selectedProductContainsCategory;
        this.newProduct = newProduct;
        this.removeStore = removeStore;
        this.categoryCheckedChange = categoryCheckedChange;
        this.selectedProduct = new Product();
        this.selectedImage = {};
        this.products = [];
        firebaseService.onAuthStateChanged(function() {
            if (firebaseService.isLogged()) {
                firebaseService.registerLoadProductsCallback((products) => {
                    ctrl.products = products;
                    ctrl.loading = false;
                    loadProductImages();
                });
            } else {
                $state.go('login');
            }

        });

        $scope.$watch('adminCtrl.loading', function(newValue) {
            ctrl.loading = newValue;
        });

        function submit() {
            ctrl.loading = true;
            delete ctrl.selectedProduct.image_url;
            firebaseService.saveProduct(ctrl.selectedProduct, ctrl.selectedImage.image, function(error) {
                $('.modal').modal("close");
                ctrl.loading = false;
                $scope.$digest();
                if (error) {
                    Materialize.toast("Error at saving '" + ctrl.selectedProduct.name + "': " + error , 6000);
                } else {
                    Materialize.toast("'" + ctrl.selectedProduct.name + "' was saved successfully!" , 4000);
                }
            });
        }

        function logout() {
            ctrl.loading = true;
            firebaseService.doLogout().then(function() {
                ctrl.loading = false;
            }, function(error) {
                Materialize.toast("Error at logout: " + error , 6000);
                ctrl.loading = false;
            });
        }

        function newProduct() {
            ctrl.selectedProduct = new Product();
            ctrl.selectedImage = {};
        }

        function selectedProductContainsCategory(category) {
            return ctrl.selectedProduct.tags.indexOf(category.id) > -1;
        }

        function selectedProductContainsLocalStore() {
            var index = -1;
            ctrl.selectedProduct.whereBuy.forEach(function(value, key) {
                if (value.local) {
                    index = key;
                }
            });
            return index > -1;
        }

        function selectedProductContainsInternetStore() {
            var index = -1;
            ctrl.selectedProduct.whereBuy.forEach(function(value, key) {
                if (value.url) {
                    index = key;
                }
            });
            return index > -1;
        }

        function loadProductImages() {
            ctrl.products.forEach(function(product) {
                firebaseService.getProductImageUrl(product.image).then(function(url) {
                    product.image_url = url;
                    $scope.$digest();
                });
            });
        }

        function removeStore(store) {
            var index = -1;
            ctrl.selectedProduct.whereBuy.forEach(function(value, key) {
                if (angular.equals(store, value)) {
                    index = key;
                }
            });

            if (index != -1) {
                ctrl.selectedProduct.whereBuy.splice(index, 1);
                if (store.local && !selectedProductContainsLocalStore()) {
                    removeCategoryFromSelectedProduct(Categories.BUY_LOCAL);
                } else if (!selectedProductContainsInternetStore()) {
                    removeCategoryFromSelectedProduct(Categories.BUY_FROM_INTERNET);
                }
            }
        }

        function addNewStore() {
            var store = {
              store: ctrl.newStore.name
            };
            if (Categories.BUY_FROM_INTERNET.id == $("#selectWhereBuy").val()) {
                store["url"] = ctrl.newStore.url;
                if (!selectedProductContainsCategory(Categories.BUY_FROM_INTERNET)) {
                    ctrl.selectedProduct.tags.push(Categories.BUY_FROM_INTERNET.id);
                }
            } else {
                store["local"] = ctrl.newStore.url;
                if (!selectedProductContainsCategory(Categories.BUY_LOCAL)) {
                    ctrl.selectedProduct.tags.push(Categories.BUY_LOCAL.id);
                }
            }
            ctrl.selectedProduct.whereBuy.push(store);



            ctrl.newStore = {};
        }

        function categoryCheckedChange(category) {
            var isSelectedProductContainsCategory = selectedProductContainsCategory(category);
            var isChecking = $("#" + category.id).attr("checked") !== "checked";
            if (isChecking && !isSelectedProductContainsCategory) {
                ctrl.selectedProduct.tags.push(category.id);
            } else {
                removeCategoryFromSelectedProduct(category);
            }

        }

        function removeCategoryFromSelectedProduct(category) {
            var index = ctrl.selectedProduct.tags.indexOf(category.id);
            if (index > -1) {
                ctrl.selectedProduct.tags.splice(index, 1);
            }

        }

        function clickItem(product) {
            ctrl.selectedProduct = angular.copy(product);
            ctrl.selectedImage = {
                url: product.image_url
            };
            $timeout(function() {
                Materialize.updateTextFields();
            });

        }

        $('.modal').modal();
        $('#selectWhereBuy').material_select();

    };

    app.directive("selectedimage", SelectedImage);
        function SelectedImage() {
        return {
            scope: {
                selectedimage: "="
            },
            link: function (scope, element, attributes) {
                element.bind("change", function (changeEvent) {
                    var r = new FileReader();
                    r.onload = function(e){
                        scope.selectedimage.url = e.target.result;
                        scope.$apply();
                    };
                    if (changeEvent.target.files[0] && changeEvent.target.files[0] instanceof Blob) {
                        scope.selectedimage.image = changeEvent.target.files[0];
                        r.readAsDataURL(changeEvent.target.files[0]);
                    }
                });
            }
        }
    };


    //Refatorar colocar product para ser em um outro javascript
    var Product = function() {
        this.tags = [];
        this.whereBuy =[];
        this.name = "";
        this.image = "";
        this.amount = 1;
        this.alreadyHaveIt = false;
        this.cost = 0.0;
    }

})();
