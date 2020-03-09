const express = require('express');
const cors = require('cors');
const fetch = require('cross-fetch');

const app = express();
app.use(cors());

const ACCOUNT_ID = 4540911;
const PORT = 5000;

const filterTags = async (account, tag) => {
    const maxSize = 1000;
    let mediaItems = [];
    let endCursor = null;
    do {
        const url = endCursor ? `https://www.instagram.com/graphql/query/?query_id=17880160963012870&id=${account}&first=50&after=${endCursor}` : `https://www.instagram.com/graphql/query/?query_id=17880160963012870&id=${account}&first=50`;
        
        const response = await fetch(url);
        const information = await response.json();

        endCursor = information.data.user.edge_owner_to_timeline_media.page_info.end_cursor;
        const nodes = information.data.user.edge_owner_to_timeline_media.edges;

        mediaItems = [...mediaItems, ...nodes];

    } while (endCursor !== null && mediaItems.length < maxSize);


    const filterWithCaptionList = mediaItems.filter(item => item.node.edge_media_to_caption.edges.length > 0);
    const filterWithHastTag = filterWithCaptionList.filter(item => item.node.edge_media_to_caption.edges[0].node.text.indexOf(`#${tag}`) > -1);

    return filterWithHastTag.map(item => {
        const { id, edge_media_to_caption, shortcode, edge_media_to_comment, dimensions, display_url, edge_liked_by, owner, thumbnail_src } = item.node;
        return {
            id,
            caption: edge_media_to_caption.edges[0].node.text,
            shortcode,
            comments: edge_media_to_comment.count,
            dimensions,
            display_url,
            likes: edge_liked_by.count,
            owner: owner.id,
            thumbnail_src
        };
    });
};


app.get('/', async (req, res) => {
    let { hashtag = '' } = req.query;
    hashtag = hashtag.trim();
    
    if(hashtag === '') {
        res.json({ status: 'error', message: 'Missing hashtag param' });
    } else {
        const media = await filterTags(ACCOUNT_ID, hashtag);
        res.json(media);
    }
});


app.listen(PORT, () => console.log(`App runing ar port ${PORT}`));