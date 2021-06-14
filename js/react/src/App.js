import React from 'react';
import Call from "./Call";
import Conference from "./Conference";
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Link
} from "react-router-dom";

function App() {
    return (
        <Router>
            <div>
                <nav>
                    <Link to="/call">Call</Link> | <Link to="/conference">Conference</Link>
                </nav>
                <hr/>
                <Switch>
                    <Route path="/call">
                        <Call/>
                    </Route>
                    <Route path="/conference">
                        <Conference/>
                    </Route>
                    <Route path="/">
                        <Call/>
                    </Route>
                </Switch>
            </div>
        </Router>
    );
}

export default App;