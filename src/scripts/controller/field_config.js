/**
 * Created by Shuo on 11/2/2017.
 */
var solrURL = "http://localhost:9984/solr/hiking_core2/select?";
//keys for solr query.
var field_tweet_id = "id";
var field_urls = "urls";
var field_post_time = "created_at";
var field_tweet_content = "full_text";
var field_hastags = "hashtags";
var field_retweet_count = "retweet_count";
var field_favorite_count = "favorite_count";
var field_user_mentions_id_str = "user_mentions_id_str";
var field_user_mentions_name = "user_mentions_name";
var field_user_mentions_screen_name = "user_mentions_screen_name";
var field_full_text_ner = "full_text_tokens_tag";
var field_user_id_str = "user_id_str";
var field_user_name = "user_name";
var field_user_screen_name = "user_screen_name";
var field_user_location = "user_location";
var field_user_followers_count = "user_followers_count";
var field_user_favorite_count = "user_favourites_count";
// var field_in_reply_to_user_id_str = "in_reply_to_user_id_str";
var field_user_statuses_count = "user_statuses_count";
var field_user_lang = "lang";
var field_user_friend_count = "user_friends_count";
// var field_place_country_code = "place_country_code";
// var field_place_country_code = 'locations';
// var field_format='dc_format_s';
var field_cluster = "title";
// var field_format = "dc_format_s";
