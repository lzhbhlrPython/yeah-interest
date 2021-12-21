Vue.component('blog-card', {
  template: '#blog-card',
  data: () => ({
    name: '10 Best Things to Do in Seattle',
    category: 'Travel',
    image: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/1159990/pike-place.jpg',
    author: 'Katherine Kato',
    desc: `Seattle is a seaport city on the west coast of the United States...` }) });



new Vue({
  el: '#container' });