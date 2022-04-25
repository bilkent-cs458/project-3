import {render, screen, fireEvent, within, waitFor, getAllByTestId} from '@testing-library/react';
import App from './App';
import React from "react";

it('renders without crashing', () => {
    const mockGeolocation = {
        getCurrentPosition: jest.fn(),
        watchPosition: jest.fn()
    };

    global.navigator.geolocation = mockGeolocation;
    render(<App/>);
});

test("renders all components", () => {
    render(<App/>)
    expect(screen.getByText("Manual Coordinates")).toBeInTheDocument()
    expect(screen.getByText("Country")).toBeInTheDocument()
    expect(screen.getByText("Auto Latitude")).toBeInTheDocument()
    expect(screen.getByText("Auto Longitude")).toBeInTheDocument()
    expect(screen.getByText("Distance to the North Pole")).toBeInTheDocument()
    expect(screen.getByText("Distance to the Moon")).toBeInTheDocument()

})

test("an input from the user is waited for before sending out a country identification query", async () => {
    render(<App/>)
    expect(screen.getByText("Waiting for input")).toBeInTheDocument();
    expect(screen.getAllByText("Latitude")).toHaveLength( 2)
    expect(screen.getAllByText("Longitude")).toHaveLength( 2)
})


test("correct country is returned", async () => {
    render(<App/>)

    const latitudeInput = screen.getByTestId("latitude-input")
    const longitudeInput = screen.getByTestId("longitude-input")

    fireEvent.change(latitudeInput, {target: {value: 10}})
    fireEvent.change(longitudeInput, {target: {value: 20}})

    await waitFor(() => expect(screen.getByText("Chad")).toBeInTheDocument())
})

test("'locality' field from geocoding API is respected when the coordinates do not fall onto a country", async () => {
    render(<App/>)

    const latitudeInput = screen.getByTestId("latitude-input")
    const longitudeInput = screen.getByTestId("longitude-input")


    fireEvent.change(latitudeInput, {target: {value: -100}})
    fireEvent.change(longitudeInput, {target: {value: 200}})

    const lat_err_msg = screen.getByText("Should be between -90 and 90")
    const long_err_msg = screen.getByText("Should be between -180 and 180")

    expect( lat_err_msg).not.toBeNull()
    expect( long_err_msg).not.toBeNull()

})

test("automatic location is detected correctly", async () => {
    const mockGeolocation = {
        getCurrentPosition: jest.fn().mockImplementation(success =>
            Promise.resolve(success({
                coords: {
                    latitude: 10.543,
                    longitude: 20.123
                }
            }))
        )
    };

    global.navigator.geolocation = mockGeolocation;

    render(<App/>)

    await waitFor(() => {
        expect(screen.getByText("10.543")).toBeInTheDocument();
        expect(screen.getByText("20.123")).toBeInTheDocument();
    })
})

test("check if country changes when new lat and long is entered", async () =>{
    render(<App/>)

    const latitudeInput = screen.getByTestId("latitude-input")
    const longitudeInput = screen.getByTestId("longitude-input")

    fireEvent.change(latitudeInput, {target: {value: 38 }})
    fireEvent.change(longitudeInput, {target: {value: 35 }})


    await waitFor( () => {
        expect(screen.getByText("Turkey")).toBeInTheDocument()
    })

    fireEvent.change( latitudeInput, {target: {value: 10}})
    fireEvent.change( longitudeInput, {target: {value: 20}})

    expect(screen.getByTestId("country-locality-p")).toHaveTextContent("Chad")
})


