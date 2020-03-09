const fetchAllMedia = async (accountId) => {

    const baseUrl = 'https://www.instagram.com/graphql/query/?query_id=17880160963012870&first=50';
    const maxSize = 500;

    let mediaItems = [];
    let endCursor = null;

    do {

        const url = endCursor ? `${baseUrl}&id=${accountId}&after=${endCursor}` : `${baseUrl}&id=${accountId}`;
        const response = await fetch(url);
        const information = await response.json();
        endCursor = information.data.user.edge_owner_to_timeline_media.page_info.end_cursor;
        const nodes = information.data.user.edge_owner_to_timeline_media.edges;
        mediaItems = [...mediaItems, ...nodes];
        
    } while (endCursor !== null && mediaItems.length < maxSize);

    return mediaItems;
};


const filterTagInMedia = (mediaItems, tag) => {
    return mediaItems
                .filter(item => item.node.edge_media_to_caption.edges.length > 0)
                .filter(item => item.node.edge_media_to_caption.edges[0].node.text.indexOf(tag) > -1);
};

const mapMediaItem = (item) => {
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
};


export const getInstagramMediaByTag = async (accountId, tag) => {
    const mediaItems = await fetchAllMedia(accountId);
    const filterWithHastTag = filterTagInMedia(mediaItems, tag);
    return  filterWithHastTag.map(mapMediaItem);
};

export const getInstagramMediaByListTags = async (accountId, listTags) => {
    const mediaItems = await fetchAllMedia(accountId);
    return listTags.map(tag => {
        const filterWithHastTag = filterTagInMedia(mediaItems, tag);
        const media = filterWithHastTag.map(mapMediaItem);
        return { tag, media }
    });
}