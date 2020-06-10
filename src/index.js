import React from 'react';
import {render} from 'react-dom';
import {Provider} from 'react-redux';
import {BrowserRouter, Route, Switch} from 'react-router-dom';
import store, {persistor} from "./store";
import {PersistGate} from 'redux-persist/integration/react';
import './app.css';
import Home from './containers/HomePage';
import Room from './containers/RoomPage';
import NotFound from "./components/NotFound";

render(
  <Provider store={store}>
    <BrowserRouter>
      <PersistGate loading={null} persistor={persistor}>
        <Switch>
          <Route exact path="/" component={Home}/>
          <Route path="/r/:room" component={Room}/>
          <Route path="*" component={NotFound}/>
        </Switch>
      </PersistGate>
    </BrowserRouter>
  </Provider>,
  document.getElementById('app')
);
