import { FC } from 'react';
import { majorScale, Pane, Heading, Spinner } from 'evergreen-ui';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Post } from '../../types';
import Container from '../../components/container';
import HomeNav from '../../components/home-nav';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { posts } from '../../content';

const BlogPost: FC<Post> = ({ source, frontMatter }) => {
  const router = useRouter();

  if (router.isFallback) {
    return (
      <Pane width="100%" height="100%">
        <Spinner size={48} />
      </Pane>
    );
  }
  return (
    <Pane>
      <Head>
        <title>{`Known Blog | ${frontMatter.title}`}</title>
        <meta name="description" content={frontMatter.summary} />
      </Head>
      <header>
        <HomeNav />
      </header>
      <main>
        <Container>
          <Heading
            fontSize="clamp(2rem, 8vw, 6rem)"
            lineHeight="clamp(2rem, 8vw, 6rem)"
            marginY={majorScale(3)}
          >
            {frontMatter.title}
          </Heading>
          <Pane>
            <MDXRemote {...source} />
          </Pane>
        </Container>
      </main>
    </Pane>
  );
};

BlogPost.defaultProps = {
  source: '' as unknown as MDXRemoteSerializeResult<Record<string, unknown>>,
  frontMatter: { title: 'default title', summary: 'summary', publishedOn: '' },
};

export function getStaticPaths() {
  const filenames = fs.readdirSync(path.join(process.cwd(), 'posts'));
  const slugs = filenames.map((name) => {
    const filePath = path.join(path.join(process.cwd(), 'posts'), name);
    const file = fs.readFileSync(filePath, 'utf-8');
    const { data } = matter(file);
    return data;
  });

  return {
    paths: slugs.map((s) => ({ params: { slug: s.slug } })),
    // false gives a 404 for bad slugs
    // 'blocking' will wait forever until page is generated from the cms
    // true generates a page
    fallback: true,
  };
}

/**
 * Need to get the paths here
 * then the the correct post for the matching path
 * Posts can come from the fs or our CMS
 */
export async function getStaticProps({ params, preview }) {
  let post;
  try {
    const filesPath = path.join(process.cwd(), 'posts', params.slug + '.mdx');
    post = fs.readFileSync(filesPath, 'utf-8');
  } catch {
    console.log('should match with', params.slug);
    const cmsPosts = (preview ? posts.draft : posts.published).map((p) => {
      return matter(p);
    });

    const match = cmsPosts.find((p) => p.data.slug === params.slug);
    post = match.content;
  }
  const { data } = matter(post);
  const mdxSource = await serialize(post, { scope: data });

  return {
    props: {
      source: mdxSource,
      frontMatter: data,
    },
  };
}

export default BlogPost;
