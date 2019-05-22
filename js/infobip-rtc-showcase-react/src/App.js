import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Call from "./Call";
import Home from "./Home";
import ReceiveCall from "./ReceiveCall";


function App() {
  return (
    <div>
        <Router>
            <Switch>
                <Route exact path="/" component={Home} />
                <Route path="/call" component={Call} />
                <Route path="/receive-call" component={ReceiveCall} />
            </Switch>
        </Router>
    </div>

  );
}

export default App;
