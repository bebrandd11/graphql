import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  FlatList,
} from 'react-native';
import { Query } from 'react-apollo';
import TodoItem from './TodoItem';
import LoadOlder from './LoadOlder';
import LoadNewer from './LoadNewer';
import CenterSpinner from '../Util/CenterSpinner';
import gql from 'graphql-tag';
import { withApollo } from 'react-apollo';

const SUBSCRIBE_TO_NEW_TODOS = gql`
  subscription notifyNewTodo{
    todos(order_by: {id: desc}, limit: 1, where: {is_public: {_eq: true}}) {
      id
      title
    }
  }
`;

export const FETCH_TODOS = gql`
  query getMyTodos($is_public: Boolean) {
    todos(where: {is_public: {_eq: $is_public}}, order_by: {created_at: desc}, limit: 10) {
      id
      title
      created_at
      is_completed
      is_public
      user {
        name
      }
    }
  }
`

const Todos = (isPublic, ...props ) => {

  const [newTodosExist, setNewTodosExist] = useState(false);
  
  // const {isPublic} = props;
  // const data = {
  //   todos: [ ]
  // }

  subscribeToNewTodos = () => {
    const { client } = props;
    if (isPublic) {
      client.subscribe({
        query: SUBSCRIBE_TO_NEW_TODOS,
      }).subscribe({
        next: (event) => {
          if (event.data.todos.length) {
            let localData; 
            try {
              localData = client.readQuery({
                query: FETCH_TODOS,
                variables: {
                  isPublic: true,
                }
              });
            } catch (e) {
              return;
            }
            const lastId = localData.todos[0] ? localData.todos[0].id : 0;
            if (event.data.todos[0].id > lastId) {
              setNewTodosExist(true)
            }
          }
        },
        error: (err) => {
          console.log("err", err);
        }
      })
    }
  };
  // useEffect(subscribeToNewTodos, []);
  useEffect(() => {
    subscribeToNewTodos
  }, [])

  const dismissNewTodoBanner = () => {
    setNewTodosExist(false);
  }

  return (
    <Query query={FETCH_TODOS} variables={{$is_public: props.isPublic}}>
      {({ data, error, loading }) => {
        if (error) {
          console.log(error);
          return <Text>Error</Text>
        }
        if (loading) {
          return <CenterSpinner />
        }
        if (!data || !data.todos) return null
        return (
          <View style={styles.container}>
            <LoadNewer show={newTodosExist && isPublic} styles={styles} isPublic={props.isPublic} />
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContainer}>
              <FlatList
                data={data.todos}
                renderItem={({ item }) => <TodoItem item={item} isPublic={props.isPublic} />}
                keyExtractor={(item) => item.id.toString()}
              />
              <LoadOlder
                isPublic={props.isPublic}
                styles={styles}
              />
            </ScrollView>
          </View>
        )
      }}
    </Query>
  );

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 0.8,
    paddingHorizontal: 10,
    backgroundColor: '#F7F7F7'
  },
  scrollViewContainer: {
    justifyContent: 'flex-start'
  },
  banner: {
    flexDirection: 'column',
    backgroundColor: '#39235A',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  pagination: {
    flexDirection: 'row',
    backgroundColor: '#39235A',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
    borderRadius: 5,
    marginBottom: 20,
    paddingVertical: 5,
  },
  buttonText: {
    color: 'white'
  }
});

export default withApollo(Todos);