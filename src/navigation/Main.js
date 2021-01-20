import React, { useEffect, useState } from 'react'
import { AsyncStorage } from 'react-native'
import Drawer from './DrawerNavigator'
import CenterSpinner from '../screens/components/Util/CenterSpinner'
import { WebSocketLink } from 'apollo-link-ws'
import { ApolloClient } from 'apollo-client'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { ApolloProvider } from 'react-apollo'
import gql from 'graphql-tag'

const makeApolloClient = token => {
  const link = new WebSocketLink({
    uri: 'https://hasura.io/learn/graphql',
    options: {
      reconnect: true,
      connectionParams: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    }
  })
  const cache = new InMemoryCache()
  const client = new ApolloClient({
    link,
    cache
  })
  return client
}
console.disableYellowBox = true

const emitOnlineEvent = gql`
  mutation {
    update_users(_set: {
      last_seen: "now()"
    }, where: {}) {
      affected_rows
    }
  }
`;

const Main = () =>  {
  const [client, setClient] = useState(null);

  const fetchSession = async () => {
    const session = await AsyncStorage.getItem('@todo-graphql:session')
    const sessionObj = JSON.parse(session)
    const { token, id } = sessionObj

    const client = makeApolloClient(token)

    setClient(client)
    setInterval(() => {
      client.mutate({
        mutation: emitOnlineEvent
      })
    }, 30000);
  }

  useEffect(() => {
    fetchSession();
  }, [])

  if (!client) {
    return <CenterSpinner />
  }

  return (
    <ApolloProvider client={client}>
      <Drawer />
    </ApolloProvider>
  )
}

export default Main;