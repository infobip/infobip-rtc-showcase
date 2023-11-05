import React from 'react';
import {
    BrowserRouter as Router,
    Switch,
    Route
} from 'react-router-dom';
import Agent from './Agent';
import Customer from './Customer';
import Role from "./Role";

function App() {
    const title = 'Infobip RTC Application Call Showcase';

    return (
        <Router>
            <div>
                <h2><span>{title}</span></h2>

                <Switch>
                    <Route path="/agent">
                        <Agent/>
                    </Route>
                    <Route path="/customer">
                        <Customer/>
                    </Route>
                    <Route path="/">
                        <Role/>
                    </Route>
                </Switch>
            </div>
        </Router>
    );
}

export default App;