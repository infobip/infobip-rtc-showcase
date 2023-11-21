import {Component} from "react";
import {getDateString} from "./MessageUtil";

class SentMessage extends Component {
    render() {
        const {message} = this.props;

        const primaryText = `${message?.text} (${message?.status})`
        const secondaryText = `(You) at ${getDateString(message)} ${message?.to ? `(Direct to ${message?.to})` : ''}`

        return <div>
            <p>{secondaryText}</p>
            <p>{primaryText}</p>
        </div>
    }
}

export default SentMessage
