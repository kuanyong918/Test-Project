import { Component, OnInit, ViewChild } from '@angular/core';
import { UserService } from '../Service/user.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalComponent } from 'ng2-bs3-modal/ng2-bs3-modal';
import { IUser } from '../Model/user';
import { userItem } from '../Model/userItem';
import { shoppingCart } from '../Model/shoppingCart';
import { DBOperation } from '../Shared/enum';
import { Observable } from 'rxjs/Rx';
import { Global } from '../Shared/global';

@Component({
    templateUrl: 'app/Components/user.component.html'
})

export class UserComponent implements OnInit {

    @ViewChild('modal') modal: ModalComponent;
    users: IUser[];
    user: IUser;
    selectedUsers: IUser[] = [];
    currentUser: IUser;
    msg: string;
    indLoading: boolean = false;
    userFrm: FormGroup;
    dbops: DBOperation;
    modalTitle: string;
    modalBtnTitle: string;
    currentShoppingCart: shoppingCart;

    constructor(private fb: FormBuilder, private _userService: UserService) { }

    ngOnInit(): void {
        this.userFrm = this.fb.group({
            Id: [''],
            FirstName: ['', Validators.required],
            LastName: [''],
            Gender: ['', Validators.required]
        });
        this.LoadUsers();
        this.LoadShoppingCart();
    }

    checkboxChanged(userIdString: string) {
        var userId = parseInt(userIdString);
        for (var i = 0; i < this.selectedUsers.length; i++) {
            if (this.selectedUsers[i].Id == (userId)) {
                this.selectedUsers.splice(i, 1);
                return;
            }

        }
        //is user is not in selected user list

        //find the user with user id first
        var currentSelectedUsers = this.findUserById(userId);
        if (currentSelectedUsers != null) {
            this.selectedUsers.push();

        }
    }


    findUserById(userId: number) {
        for (var i = 0; i < this.selectedUsers.length; i++) {
            if (this.selectedUsers[i].Id == (userId)) {
                return this.selectedUsers[i];
            }
        }
        return null;
    }

    LoadShoppingCart(): void {
        this.currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
        this.currentShoppingCart = JSON.parse(localStorage.getItem("currentShoppingCart" + this.currentUser.Id));
    }

    LoadUsers(): void {
        this.indLoading = true;
        this._userService.get(Global.BASE_USER_ENDPOINT)
            .subscribe(users => { this.users = users; this.indLoading = false; },
            error => this.msg = <any>error);
    }

    addUser() {
        this.dbops = DBOperation.create;
        this.SetControlsState(true);
        this.modalTitle = "Add New User";
        this.modalBtnTitle = "Add";
        this.userFrm.reset();
        this.modal.open();
    }

    purchaseItems() {
        //currentUser is already login, so we retrieve currentUser id first
        this.currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
        var selectedUserItemList = this.convertUserListToUserItemList(this.selectedUsers)
        //check if this user has a shopping cart already
        this.currentShoppingCart = JSON.parse(localStorage.getItem("currentShoppingCart" + this.currentUser.Id));
        if (this.currentShoppingCart == null)
        {
            this.currentShoppingCart = new shoppingCart();
            this.currentShoppingCart.userId = this.currentUser.Id;
            //this.currentShoppingCart.userList = this.selectedUsers;
            this.currentShoppingCart.userItemList = selectedUserItemList;
        }
        else
        {
            //if the current user already has a shopping cart, merge the item into shopping cart
            this.currentShoppingCart.userItemList = this.mergeItemList(this.currentShoppingCart.userItemList, selectedUserItemList);
        }

        localStorage.setItem("currentShoppingCart" + this.currentUser.Id, JSON.stringify(this.currentShoppingCart));
    }

    convertUserListToUserItemList(selectedUsers: IUser[]) {
        var userItemList: userItem[] = [];
        for (var i = 0; i < selectedUsers.length; i++)
        {
            var tempUserItem = new userItem();
            tempUserItem.Quantity = 1;
            tempUserItem.user = selectedUsers[i];
            //if using product, you can use product * quantity to get the subtotal for the following line
            tempUserItem.Subtotal = 10.00 * tempUserItem.Quantity;      //assume price is 10
            userItemList.push(tempUserItem);
        }
        return userItemList;
    }

    mergeItemList(existingItems: userItem[], newItemList: userItem[]) {
        var matchingFlag = false;
        for (var i = 0; i < existingItems.length; i++)
        {
            var currentItem = existingItems[i];
            matchingFlag = false;
            for (var j = 0; j < newItemList.length; j++)
            {
                if (currentItem.user.Id == newItemList[j].user.Id)      //for product, you have to compare product ID. If you compare the object, they are comparing the memory address
                {
                    //new item are duplicated with existing item, update the item quantity
                    matchingFlag = true;
                    newItemList[j].Quantity = currentItem.Quantity + newItemList[j].Quantity;
                    break;
                }
            }
            //end of for loop, find existing item index = i, does not match any newItems
            if (matchingFlag )
            {
                newItemList.push(currentItem);
            }
        }
        return newItemList;
    }

    editUser(id: number) {
        this.dbops = DBOperation.update;
        this.SetControlsState(true);
        this.modalTitle = "Edit User";
        this.modalBtnTitle = "Update";
        this.user = this.users.filter(x => x.Id == id)[0];
        this.userFrm.setValue(this.user);
        this.modal.open();
    }

    deleteUser(id: number) {
        this.dbops = DBOperation.delete;
        this.SetControlsState(false);
        this.modalTitle = "Confirm to Delete?";
        this.modalBtnTitle = "Delete";
        this.user = this.users.filter(x => x.Id == id)[0];
        this.userFrm.setValue(this.user);
        this.modal.open();
    }

    onSubmit(formData: any) {
        this.msg = "";
   
        switch (this.dbops) {
            case DBOperation.create:
                this._userService.post(Global.BASE_USER_ENDPOINT, formData._value).subscribe(
                    data => {
                        if (data == 1) //Success
                        {
                            this.msg = "Data successfully added.";
                            this.LoadUsers();
                        }
                        else
                        {
                            this.msg = "There is some issue in saving records, please contact to system administrator!"
                        }
                        
                        this.modal.dismiss();
                    },
                    error => {
                      this.msg = error;
                    }
                );
                break;
            case DBOperation.update:
                this._userService.put(Global.BASE_USER_ENDPOINT, formData._value.Id, formData._value).subscribe(
                    data => {
                        if (data == 1) //Success
                        {
                            this.msg = "Data successfully updated.";
                            this.LoadUsers();
                        }
                        else {
                            this.msg = "There is some issue in saving records, please contact to system administrator!"
                        }

                        this.modal.dismiss();
                    },
                    error => {
                        this.msg = error;
                    }
                );
                break;
            case DBOperation.delete:
                this._userService.delete(Global.BASE_USER_ENDPOINT, formData._value.Id).subscribe(
                    data => {
                        if (data == 1) //Success
                        {
                            this.msg = "Data successfully deleted.";
                            this.LoadUsers();
                        }
                        else {
                            this.msg = "There is some issue in saving records, please contact to system administrator!"
                        }

                        this.modal.dismiss();
                    },
                    error => {
                        this.msg = error;
                    }
                );
                break;

        }
    }

    SetControlsState(isEnable: boolean)
    {
        isEnable ? this.userFrm.enable() : this.userFrm.disable();
    }
}