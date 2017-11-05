import { Component, OnInit } from "@angular/core";
import { UserService } from "../Service/user.service";
import { Global } from "../Shared/global";
import { IUser } from "../Model/user";

@Component({
    template: `<img src="../../images/users.png" style="text-align:center"/>
<br/>
<div name="userNameDiv">
    <label for="username">Username</label>
    <input #username type="text" name="username" required />
</div>
<div name="passwordDiv">
    <label for="password">Password</label>
    <input #password type="password" name="password" required />
</div>
<div name="buttonDiv">
    <button (click)="login(username.value, password.value)" class="btn btn-primary">Login</button>
</div>
<br/>
    {{clickMessage}}`
})

export class HomeComponent implements OnInit {
    
    clickMessage = '';
    users: IUser[];
    user: IUser;
    msg: string;
    indLoading: boolean = false;

    constructor(private _userService: UserService) { }

    ngOnInit(): void {
        this.LoadUsers();
    }

    login(username: string, password: string) {
        var userNameFound = false;
        var passwordNotMatch = false;

        for (var i = 0; i < this.users.length; i++)
        {
            if (this.users[i].LastName == username)
            {
                userNameFound = true;
                //we found the user, match first name with password
                if (password = this.users[i].FirstName)
                {
                    this.clickMessage = 'Login successfully!';
                    return;
                }
                else
                {
                    passwordNotMatch = true;
                }
            }
        }

        this.clickMessage = 'Login failed!';
        if (userNameFound)
            this.clickMessage = this.clickMessage + " Due to not matching password!";
        else
            this.clickMessage = this.clickMessage + " User Name not found!";
    }

    LoadUsers(): void {
        this.indLoading = true;
        this._userService.get(Global.BASE_USER_ENDPOINT)
            .subscribe(users => { this.users = users; this.indLoading = false; },
            //error => this.msg = <any>error
        );
    }
}
