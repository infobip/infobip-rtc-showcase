import React from 'react';
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Link
} from "react-router-dom";
import RoomCall from "./RoomCall";
import WebrtcCall from "./WebrtcCall";
import PhoneCall from "./PhoneCall";

function App() {
    return (
        <Router>
            <div>
                <nav>
                    <Link to="/webrtc-call">WebRTC Call</Link> | <Link to="/phone-call">Phone Call</Link> | <Link to="/room-call">Room Call</Link>
                </nav>
                <hr/>
                <Switch>
                    <Route path="/webrtc-call">
                        <WebrtcCall/>
                    </Route>
                    <Route path="/phone-call">
                        <PhoneCall/>
                    </Route>
                    <Route path="/room-call">
                        <RoomCall/>
                    </Route>
                    <Route path="/">
                        <WebrtcCall/>
                    </Route>
                </Switch>
            </div>
        </Router>
    );
}

export default App;