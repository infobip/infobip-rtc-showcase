import React, {Component} from "react";

class Role extends Component {
    constructor(props) {
        super(props);
        this.state = { };
    }

    loginCustomer = () => {
        window.location.href = '/customer';
    }

    loginAgent = () => {
        window.location.href = '/agent';
    }

    render = () => {
        return (
            <div>
                <button onClick={() => this.loginCustomer()}>Customer Login</button>
                <button onClick={() => this.loginAgent()}>Agent Login</button>
            </div>
        )
    }
}

export default Role;