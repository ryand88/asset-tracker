import * as React from "react";
import { Query, Mutation } from "react-apollo";

import {
  SINGLE_LOCATION_QUERY,
  CREATE_LOCATION_NOTE
} from "../../gql/location";
import DeleteLocation from "../Delete/DeleteLocation";
import ListPageHeader from "../common/ListPageHeader";
import ListView from "../common/ListView";
import Notes from "../common/Notes";

export interface LocationProps {
  path: string;
  locationId: string;
}

export interface LocationState {
  deleteMode: boolean;
  isCreateMode: boolean;
}

export default class Location extends React.Component<
  LocationProps,
  LocationState
> {
  state = { deleteMode: false, isCreateMode: false };

  openCreateMode = () => {
    this.setState({ isCreateMode: true });
  };

  closeCreateMode = () => {
    this.setState({ isCreateMode: false });
  };

  deleteToggle = () => {
    this.setState((prevState: LocationState) => {
      return { deleteMode: !prevState.deleteMode };
    });
  };

  public render() {
    const { deleteMode } = this.state;
    return (
      <Query
        query={SINGLE_LOCATION_QUERY}
        variables={{ locationId: this.props.locationId }}
      >
        {({ loading, data }) => {
          if (loading) {
            return <div>Loading...</div>;
          } else {
            const groupId = data.defaultGroupId;
            const {
              name,
              customer,
              address,
              assets,
              notes
            } = data.getLocationById;
            const listData = assets.map((asset: any) => {
              return {
                make: asset.equipment.name,
                model: asset.equipment.model,
                serial: asset.serial,
                // description: asset.description,
                id: asset.id
              };
            });
            const variables = {
              locationId: this.props.locationId,
              groupId
            };
            return (
              <>
                <ListPageHeader
                  title={name}
                  titleAffix={customer.name}
                  subTitle={address}
                  deleteToggle={this.deleteToggle}
                />
                {deleteMode && (
                  <DeleteLocation
                    customerId={customer.id}
                    cancelDelete={this.deleteToggle}
                    locationName={name}
                    locationId={this.props.locationId}
                  />
                )}
                {listData.length > 0 ? (
                  <ListView listData={listData} linkTo="asset" />
                ) : (
                  "No equipment for this location"
                )}
                <Mutation
                  mutation={CREATE_LOCATION_NOTE}
                  update={(cache: any, { data: { createLocationNote } }) => {
                    const newNote = createLocationNote.notes;
                    const query = {
                      query: SINGLE_LOCATION_QUERY,
                      variables: { locationId: this.props.locationId }
                    };
                    const { getLocationById } = cache.readQuery(query);
                    const { notes } = getLocationById;
                    cache.writeQuery({
                      ...query,
                      data: {
                        getLocationById: {
                          ...getLocationById,
                          notes: notes.concat(newNote)
                        }
                      }
                    });
                  }}
                >
                  {createLocationNote => (
                    <Notes
                      onClick={createLocationNote}
                      variables={variables}
                      notes={notes}
                    />
                  )}
                </Mutation>
              </>
            );
          }
        }}
      </Query>
    );
  }
}
