import gql from 'graphql-tag';

const doc = gql`
  query GetHero {
    hero {
      id
      name
    }
  }
`;

export default { doc };
