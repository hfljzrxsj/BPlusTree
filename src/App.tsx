import { createContext, StrictMode } from 'react';
// import MyRoute from './Route';
// import { HashRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store';
import SnackbarAlert from './components/SnackbarAlert';
import {
  CssBaseline, ScopedCssBaseline, StyledEngineProvider,
  // useMediaQuery
} from '@mui/material';
import BPlusTree from './pages/BPlusTree';
// import './mock';

export const commonUseRequestParams = {
  loadingDelay: 300,
  throttleWait: 300,
};

export const MediaQueryContext = createContext(false);

export default () => {
  // const theme = useTheme();
  // console.log(theme.breakpoints.up('lg'), theme.mixins.toolbar);
  // const matches = useMediaQuery('(orientation:landscape)');
  // const matches = innerWidth >= innerHeight;
  return <StrictMode><StyledEngineProvider injectFirst><ScopedCssBaseline><CssBaseline /><Provider store={store}>
    {/* <MediaQueryContext.Provider value={matches}>
      <HashRouter>
        <MyRoute />
      </HashRouter> */}
    < BPlusTree />
    <SnackbarAlert />
    {/* </MediaQueryContext.Provider> */}
  </Provider>
  </ScopedCssBaseline>
  </StyledEngineProvider>
  </StrictMode>;
};