import {Component} from "react";
import {getDateString} from "./MessageUtil";

class ReceivedBroadcast extends Component {
    render() {
        const {message} = this.props;

        const primaryText = message?.text;
        const secondaryText = `(Broadcast) at ${getDateString(message)}`

        return <div>
            <p>{secondaryText}</p>
            <p>{primaryText}</p>
        </div>
    }
}

export default ReceivedBroadcast
