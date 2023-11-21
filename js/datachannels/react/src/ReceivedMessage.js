import {Component} from "react";
import {getDateString} from "./MessageUtil";

class ReceivedMessage extends Component {
    render() {
        const {message} = this.props;

        const primaryText = message?.text;
        const secondaryText = `From ${message?.from} at ${getDateString(message)} ${message?.isDirect ? '(Direct)' : ''}`

        return <div>
            <p>{secondaryText}</p>
            <p>{primaryText}</p>
        </div>
    }
}

export default ReceivedMessage
