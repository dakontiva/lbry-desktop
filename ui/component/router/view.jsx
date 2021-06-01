// @flow
import React, { useEffect, Suspense, lazy } from 'react';
import { Route, Redirect, Switch, withRouter } from 'react-router-dom';
import LoadingBar from 'react-top-loading-bar';

import * as PAGES from 'constants/pages';
import { LINKED_COMMENT_QUERY_PARAM } from 'constants/comment';
import { parseURI, isURIValid } from 'lbry-redux';
import { SITE_TITLE, WELCOME_VERSION, SIMPLE_SITE } from 'config';

import HomePage from 'page/home';

const BuyPage = lazy(() => import('page/buy'));
const ChannelNew = lazy(() => import('page/channelNew'));
const ChannelsFollowingDiscoverPage = lazy(() => import('page/channelsFollowingDiscover'));
const ChannelsFollowingPage = lazy(() => import('page/channelsFollowing'));
const ChannelsPage = lazy(() => import('page/channels'));
const CheckoutPage = lazy(() => import('page/checkoutPage'));
const CreatorDashboard = lazy(() => import('page/creatorDashboard'));
const DiscoverPage = lazy(() => import('page/discover'));
const EmbedWrapperPage = lazy(() => import('page/embedWrapper'));
const FileListPublished = lazy(() => import('page/fileListPublished'));
const FourOhFourPage = lazy(() => import('page/fourOhFour'));
const HelpPage = lazy(() => import('page/help'));
const InvitePage = lazy(() => import('page/invite'));
const InvitedPage = lazy(() => import('page/invited'));
const LibraryPage = lazy(() => import('page/library'));
const ListBlockedPage = lazy(() => import('page/listBlocked'));
const LiveStreamSetupPage = lazy(() => import('page/livestreamSetup'));
const LivestreamCurrentPage = lazy(() => import('page/livestreamCurrent'));
const NotificationsPage = lazy(() => import('page/notifications'));
const PasswordResetPage = lazy(() => import('page/passwordReset'));
const PasswordSetPage = lazy(() => import('page/passwordSet'));
const PublishPage = lazy(() => import('page/publish'));
const ReceivePage = lazy(() => import('page/receive'));
const ReportContentPage = lazy(() => import('page/reportContent'));
const ReportPage = lazy(() => import('page/report'));
const RepostNew = lazy(() => import('page/repost'));
const RewardsPage = lazy(() => import('page/rewards'));
const RewardsVerifyPage = lazy(() => import('page/rewardsVerify'));
const SearchPage = lazy(() => import('page/search'));
const SendPage = lazy(() => import('page/send'));
const SettingsAdvancedPage = lazy(() => import('page/settingsAdvanced'));
const SettingsCreatorPage = lazy(() => import('page/settingsCreator'));
const SettingsNotificationsPage = lazy(() => import('page/settingsNotifications'));
const SettingsPage = lazy(() => import('page/settings'));
const ShowPage = lazy(() => import('page/show'));
const SignInPage = lazy(() => import('page/signIn'));
const SignInVerifyPage = lazy(() => import('page/signInVerify'));
const SignInWalletPasswordPage = lazy(() => import('page/signInWalletPassword'));
const SignUpPage = lazy(() => import('page/signUp'));
const SwapPage = lazy(() => import('page/swap'));
const TagsFollowingManagePage = lazy(() => import('page/tagsFollowingManage'));
const TagsFollowingPage = lazy(() => import('page/tagsFollowing'));
const TopPage = lazy(() => import('page/top'));
const WalletPage = lazy(() => import('page/wallet'));
const Welcome = lazy(() => import('page/welcome'));
const YoutubeSyncPage = lazy(() => import('page/youtubeSync'));

// @if TARGET='app'
const BackupPage = React.lazy(() => import('page/backup'));
// @endif

// @if TARGET='web'
const Code2257Page = React.lazy(() => import('web/page/code2257'));
// @endif

// Tell the browser we are handling scroll restoration
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

type Props = {
  currentScroll: number,
  isAuthenticated: boolean,
  location: { pathname: string, search: string, hash: string },
  history: {
    action: string,
    entries: { title: string }[],
    goBack: () => void,
    goForward: () => void,
    index: number,
    length: number,
    location: { pathname: string },
    push: (string) => void,
    state: {},
    replaceState: ({}, string, string) => void,
    listen: (any) => () => void,
  },
  uri: string,
  title: string,
  welcomeVersion: number,
  hasNavigated: boolean,
  setHasNavigated: () => void,
  setReferrer: (string) => void,
  hasUnclaimedRefereeReward: boolean,
  homepageData: any,
};

type PrivateRouteProps = Props & {
  component: any,
  isAuthenticated: boolean,
};

function PrivateRoute(props: PrivateRouteProps) {
  const { component: Component, isAuthenticated, ...rest } = props;
  const urlSearchParams = new URLSearchParams(props.location.search);
  const redirectUrl = urlSearchParams.get('redirect');
  return (
    <Route
      {...rest}
      render={(props) =>
        isAuthenticated || !IS_WEB ? (
          <Component {...props} />
        ) : (
          <Redirect to={`/$/${PAGES.AUTH}?redirect=${redirectUrl || props.location.pathname}`} />
        )
      }
    />
  );
}

function AppRouter(props: Props) {
  const {
    currentScroll,
    location: { pathname, search, hash },
    isAuthenticated,
    history,
    uri,
    title,
    welcomeVersion,
    hasNavigated,
    setHasNavigated,
    hasUnclaimedRefereeReward,
    setReferrer,
    homepageData,
  } = props;
  const { entries, listen, action: historyAction } = history;
  const entryIndex = history.index;
  const urlParams = new URLSearchParams(search);
  const resetScroll = urlParams.get('reset_scroll');
  const hasLinkedCommentInUrl = urlParams.get(LINKED_COMMENT_QUERY_PARAM);
  const loadingBarRef = React.useRef(null);

  const dynamicRoutes = Object.values(homepageData).filter(
    (potentialRoute: any) => potentialRoute && potentialRoute.route
  );

  // For people arriving at settings page from deeplinks, know whether they can "go back"
  useEffect(() => {
    const unlisten = listen((location, action) => {
      if (action === 'PUSH') {
        if (!hasNavigated && setHasNavigated) setHasNavigated();
      }
    });
    return unlisten;
  }, [listen, hasNavigated, setHasNavigated]);

  useEffect(() => {
    if (!hasNavigated && hasUnclaimedRefereeReward && !isAuthenticated) {
      const valid = isURIValid(uri);
      if (valid) {
        const { path } = parseURI(uri);
        if (path !== 'undefined') setReferrer(path);
      }
    }
  }, [hasNavigated, uri, hasUnclaimedRefereeReward, setReferrer, isAuthenticated]);

  useEffect(() => {
    if (uri) {
      const { channelName, streamName } = parseURI(uri);

      if (title) {
        document.title = title;
      } else if (streamName) {
        document.title = streamName;
      } else if (channelName) {
        document.title = channelName;
      } else {
        document.title = IS_WEB ? SITE_TITLE : 'LBRY';
      }
    } else {
      document.title = IS_WEB ? SITE_TITLE : 'LBRY';
    }

    // @if TARGET='app'
    entries[entryIndex].title = document.title;
    // @endif
    return () => {
      document.title = IS_WEB ? SITE_TITLE : 'LBRY';
    };
  }, [entries, entryIndex, title, uri]);

  useEffect(() => {
    if (!hasLinkedCommentInUrl) {
      if (hash && historyAction === 'PUSH') {
        const id = hash.replace('#', '');
        const element = document.getElementById(id);
        if (element) {
          window.scrollTo(0, element.offsetTop);
        }
      } else {
        window.scrollTo(0, currentScroll);
      }
    }
  }, [currentScroll, pathname, search, hash, resetScroll, hasLinkedCommentInUrl, historyAction]);

  useEffect(() => {
    if (loadingBarRef.current) {
      loadingBarRef.current.continuousStart();
    }
  });

  // react-router doesn't decode pathanmes before doing the route matching check
  // We have to redirect here because if we redirect on the server, it might get encoded again
  // in the browser causing a redirect loop
  const decodedUrl = decodeURIComponent(pathname) + search;
  if (decodedUrl !== pathname + search) {
    return <Redirect to={decodedUrl} />;
  }

  return (
    <Suspense fallback={<LoadingBar color="#f11946" ref={loadingBarRef} />}>
      <Switch>
        {/* @if TARGET='app' */}
        {welcomeVersion < WELCOME_VERSION && <Route path="/*" component={Welcome} />}
        {/* @endif */}
        <Redirect
          from={`/$/${PAGES.DEPRECATED__CHANNELS_FOLLOWING_MANAGE}`}
          to={`/$/${PAGES.CHANNELS_FOLLOWING_DISCOVER}`}
        />
        <Redirect from={`/$/${PAGES.DEPRECATED__CHANNELS_FOLLOWING}`} to={`/$/${PAGES.CHANNELS_FOLLOWING}`} />
        <Redirect from={`/$/${PAGES.DEPRECATED__TAGS_FOLLOWING}`} to={`/$/${PAGES.TAGS_FOLLOWING}`} />
        <Redirect from={`/$/${PAGES.DEPRECATED__TAGS_FOLLOWING_MANAGE}`} to={`/$/${PAGES.TAGS_FOLLOWING_MANAGE}`} />
        <Redirect from={`/$/${PAGES.DEPRECATED__PUBLISH}`} to={`/$/${PAGES.UPLOAD}`} />
        <Redirect from={`/$/${PAGES.DEPRECATED__PUBLISHED}`} to={`/$/${PAGES.UPLOADS}`} />

        <Route path={`/`} exact component={HomePage} />
        <Route path={`/$/${PAGES.DISCOVER}`} exact component={DiscoverPage} />
        {SIMPLE_SITE && <Route path={`/$/${PAGES.WILD_WEST}`} exact component={DiscoverPage} />}
        {/* $FlowFixMe */}
        {dynamicRoutes.map((dynamicRouteProps: RowDataItem) => (
          <Route
            key={dynamicRouteProps.route}
            path={dynamicRouteProps.route}
            component={(routerProps) => <DiscoverPage {...routerProps} dynamicRouteProps={dynamicRouteProps} />}
          />
        ))}

        <Route path={`/$/${PAGES.AUTH_SIGNIN}`} exact component={SignInPage} />
        <Route path={`/$/${PAGES.AUTH_PASSWORD_RESET}`} exact component={PasswordResetPage} />
        <Route path={`/$/${PAGES.AUTH_PASSWORD_SET}`} exact component={PasswordSetPage} />
        <Route path={`/$/${PAGES.AUTH}`} exact component={SignUpPage} />
        <Route path={`/$/${PAGES.AUTH}/*`} exact component={SignUpPage} />
        <Route path={`/$/${PAGES.WELCOME}`} exact component={Welcome} />

        <Route path={`/$/${PAGES.HELP}`} exact component={HelpPage} />
        {/* @if TARGET='app' */}
        <Route path={`/$/${PAGES.BACKUP}`} exact component={BackupPage} />
        {/* @endif */}
        {/* @if TARGET='web' */}
        <Route path={`/$/${PAGES.CODE_2257}`} exact component={Code2257Page} />
        {/* @endif */}
        <Route path={`/$/${PAGES.AUTH_VERIFY}`} exact component={SignInVerifyPage} />
        <Route path={`/$/${PAGES.SEARCH}`} exact component={SearchPage} />
        <Route path={`/$/${PAGES.TOP}`} exact component={TopPage} />
        <Route path={`/$/${PAGES.SETTINGS}`} exact component={SettingsPage} />
        <Route path={`/$/${PAGES.SETTINGS_ADVANCED}`} exact component={SettingsAdvancedPage} />
        <Route path={`/$/${PAGES.INVITE}/:referrer`} exact component={InvitedPage} />
        <Route path={`/$/${PAGES.CHECKOUT}`} exact component={CheckoutPage} />
        <Route path={`/$/${PAGES.REPORT_CONTENT}`} exact component={ReportContentPage} />

        <PrivateRoute {...props} exact path={`/$/${PAGES.YOUTUBE_SYNC}`} component={YoutubeSyncPage} />
        <PrivateRoute {...props} exact path={`/$/${PAGES.TAGS_FOLLOWING}`} component={TagsFollowingPage} />
        <PrivateRoute
          {...props}
          exact
          path={`/$/${PAGES.CHANNELS_FOLLOWING}`}
          component={isAuthenticated || !IS_WEB ? ChannelsFollowingPage : DiscoverPage}
        />
        <PrivateRoute {...props} path={`/$/${PAGES.SETTINGS_NOTIFICATIONS}`} component={SettingsNotificationsPage} />
        <PrivateRoute
          {...props}
          exact
          path={`/$/${PAGES.CHANNELS_FOLLOWING_DISCOVER}`}
          component={ChannelsFollowingDiscoverPage}
        />
        <PrivateRoute {...props} path={`/$/${PAGES.INVITE}`} component={InvitePage} />
        <PrivateRoute {...props} path={`/$/${PAGES.CHANNEL_NEW}`} component={ChannelNew} />
        <PrivateRoute {...props} path={`/$/${PAGES.REPOST_NEW}`} component={RepostNew} />
        <PrivateRoute {...props} path={`/$/${PAGES.UPLOADS}`} component={FileListPublished} />
        <PrivateRoute {...props} path={`/$/${PAGES.CREATOR_DASHBOARD}`} component={CreatorDashboard} />
        <PrivateRoute {...props} path={`/$/${PAGES.UPLOAD}`} component={PublishPage} />
        <PrivateRoute {...props} path={`/$/${PAGES.REPORT}`} component={ReportPage} />
        <PrivateRoute {...props} path={`/$/${PAGES.REWARDS}`} exact component={RewardsPage} />
        <PrivateRoute {...props} path={`/$/${PAGES.REWARDS_VERIFY}`} component={RewardsVerifyPage} />
        <PrivateRoute {...props} path={`/$/${PAGES.LIBRARY}`} component={LibraryPage} />
        <PrivateRoute {...props} path={`/$/${PAGES.TAGS_FOLLOWING_MANAGE}`} component={TagsFollowingManagePage} />
        <PrivateRoute {...props} path={`/$/${PAGES.SETTINGS_BLOCKED_MUTED}`} component={ListBlockedPage} />
        <PrivateRoute {...props} path={`/$/${PAGES.SETTINGS_CREATOR}`} component={SettingsCreatorPage} />
        <PrivateRoute {...props} path={`/$/${PAGES.WALLET}`} exact component={WalletPage} />
        <PrivateRoute {...props} path={`/$/${PAGES.CHANNELS}`} component={ChannelsPage} />
        <PrivateRoute {...props} path={`/$/${PAGES.LIVESTREAM}`} component={LiveStreamSetupPage} />
        <PrivateRoute {...props} path={`/$/${PAGES.LIVESTREAM_CURRENT}`} component={LivestreamCurrentPage} />
        <PrivateRoute {...props} path={`/$/${PAGES.BUY}`} component={BuyPage} />
        <PrivateRoute {...props} path={`/$/${PAGES.RECEIVE}`} component={ReceivePage} />
        <PrivateRoute {...props} path={`/$/${PAGES.SEND}`} component={SendPage} />
        <PrivateRoute {...props} path={`/$/${PAGES.SWAP}`} component={SwapPage} />
        <PrivateRoute {...props} path={`/$/${PAGES.NOTIFICATIONS}`} component={NotificationsPage} />
        <PrivateRoute {...props} path={`/$/${PAGES.AUTH_WALLET_PASSWORD}`} component={SignInWalletPasswordPage} />

        <Route path={`/$/${PAGES.EMBED}/:claimName`} exact component={EmbedWrapperPage} />
        <Route path={`/$/${PAGES.EMBED}/:claimName/:claimId`} exact component={EmbedWrapperPage} />

        {/* Below need to go at the end to make sure we don't match any of our pages first */}
        <Route path="/:claimName" exact component={ShowPage} />
        <Route path="/:claimName/:streamName" exact component={ShowPage} />
        <Route path="/*" component={FourOhFourPage} />
      </Switch>
    </Suspense>
  );
}

export default withRouter(AppRouter);
