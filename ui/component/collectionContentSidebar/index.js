import { connect } from 'react-redux';
import CollectionContent from './view';
import {
  makeSelectUrlsForCollectionId,
  makeSelectNameForCollectionId,
  makeSelectCollectionForId,
  makeSelectClaimForUri,
  makeSelectClaimIsMine,
} from 'lbry-redux';
import {
  selectPlayingUri,
} from 'redux/selectors/content';

const select = (state, props) => {
  const playingUri = selectPlayingUri(state);
  const playingUrl = playingUri && playingUri.uri;
  const claim = makeSelectClaimForUri(playingUrl)(state);
  const url = claim && claim.permanent_url;

  return {
    url,
    collection: makeSelectCollectionForId(props.id)(state),
    collectionUrls: makeSelectUrlsForCollectionId(props.id)(state),
    collectionName: makeSelectNameForCollectionId(props.id)(state),
    isMine: makeSelectClaimIsMine(url)(state),
  };
};

export default connect(select)(CollectionContent);
