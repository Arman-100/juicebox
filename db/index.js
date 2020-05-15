const { Client } = require("pg");
const client = new Client("postgres://localhost:5433/juicebox-dev");

async function getAllUsers() {
  const { rows } = await client.query(
    `SELECT id, username, name, location, active
        FROM users;`
  );
  return rows;
}

async function createUser({ username, password, name, location }) {
  try {
    const {
      rows: [users],
    } = await client.query(
      `
    INSERT INTO users(username, password, name, location)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (username) DO NOTHING
    RETURNING *;

    `,
      [username, password, name, location]
    );
    return users;
  } catch (error) {
    throw error;
  }
}

async function createPost({ authorId, title, content }) {
  try {
    const {
      rows: [posts],
    } = await client.query(
      `
    INSERT INTO posts("authorId", title, content)
    VALUES ($1, $2, $3)
    RETURNING *;
    `,
      [authorId, title, content]
    );
    return posts;
  } catch (error) {
    throw error;
  }
}

async function updateUser(id, fields = {}) {
  // build the set string
  const setString = Object.keys(fields)
    .map((key, index) => `"${key}"=$${index + 1}`)
    .join(", ");

  // return early if this is called without fields
  if (setString.length === 0) {
    return;
  }

  try {
    const {
      rows: [users],
    } = await client.query(
      `
      UPDATE users
      SET ${setString}
      WHERE id=${id}
      RETURNING *;
    `,
      Object.values(fields)
    );

    return users;
  } catch (error) {
    throw error;
  }
}

async function updatePost(id, fields = {}) {
  const setString = Object.keys(fields)
    .map((key, index) => `"${key}"=$${index + 1}`)
    .join(", ");

  if (setString.length === 0) {
    return;
  }
  try {
    const {
      rows: [posts],
    } = await client.query(
      `
      UPDATE posts
      SET ${setString}
      WHERE id=${id}
      RETURNING *;
    `,
      Object.values(fields)
    );

    return posts;
  } catch (error) {
    throw error;
  }
}

async function getAllPosts() {
  try {
    const { rows } = await client.query(
      `SELECT *
          FROM posts;`
    );
    return rows;
  } catch (error) {
    throw error;
  }
}

async function getPostsByUser(userId) {
  try {
    const { rows } = await client.query(`
      SELECT * FROM posts
      WHERE "authorId"=${userId};
    `);

    return rows;
  } catch (error) {
    throw error;
  }
}

async function getUserById(userId) {
  // first get the user
  try {
    const {
      rows: [users],
    } = await client.query(`
    SELECT id, username, name, location, active FROM users
    WHERE id=${userId};
    `);
    if (!users) {
      return null;
    }
    users.posts = await getPostsByUser(userId);
    console.log("FEARGSRHNNSYTSDJNNJNSRF", users);
    return users;
  } catch (error) {
    console.error(error);
  }
  // if it doesn't exist, return null
  // if it does:
  // delete the 'password' key from the returned object
  // get their posts (use getPostsByUser)
  // then add the posts to the user object with key 'posts'
  // return the user object
}

async function createTags(tagList) {
  if (tagList.length === 0) {
    return;
  }

  // need something like: $1), ($2), ($3
  const insertValues = tagList.map((_, index) => `$${index + 1}`).join("), (");
  // then we can use: (${ insertValues }) in our string template

  // need something like $1, $2, $3
  const selectValues = tagList.map((_, index) => `$${index + 1}`).join(", ");
  // then we can use (${ selectValues }) in our string template

  try {
    await client.query(`
    INSERT INTO tags(id, name)
    VALUES (${insertValues})
    ON CONFLICT (name) DO NOTHING;
    
    `);

    const {
      response: { rows },
    } = await client.query(`
    SELECT * tags
    WHERE name IN (${selectValues})
    `);
    // insert the tags, doing nothing on conflict
    // returning nothing, we'll query after
    // select all tags where the name is in our taglist
    // return the rows from the query
  } catch (error) {
    throw error;
  }
}

module.exports = {
  client,
  getAllUsers,
  createUser,
  updateUser,
  updatePost,
  getAllPosts,
  createPost,
  getPostsByUser,
  getUserById,
};
