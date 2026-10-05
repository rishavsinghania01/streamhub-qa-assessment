class PostsClient {
  constructor(request) { this.request = request; }
  create(payload) { return this.request.post('/posts', { data: payload, failOnStatusCode: false }); }
}

module.exports = PostsClient;
