import {render, screen, fireEvent, within, waitFor, getAllByTestId} from '@testing-library/react';
import App, {getDistanceBetweenTwoPoints} from './App';
import React from "react";
import {SnackbarProvider} from "notistack";

it('renders without crashing', () => {
    render(<SnackbarProvider><App/></SnackbarProvider>);
});

test("renders all components", () => {
    render(<SnackbarProvider><App/></SnackbarProvider>)
    expect(screen.getByText("Manual Coordinates")).toBeInTheDocument()
    expect(screen.getByText("Country / Locality")).toBeInTheDocument()
    expect(screen.getByText("Auto Latitude")).toBeInTheDocument()
    expect(screen.getByText("Auto Longitude")).toBeInTheDocument()
    expect(screen.getByText("Distance to the North Pole")).toBeInTheDocument()
    expect(screen.getByText("Distance to the Moon")).toBeInTheDocument()

})

it("starts with the 'use auto coordinates' setting", () => {
    render(<SnackbarProvider><App /></SnackbarProvider>)

    const coordSwitch = screen.getByTestId("auto-coord-switch")

    expect(coordSwitch.firstChild).toHaveProperty("checked", true)
})

test("an input from the user is waited for before sending out a country identification query", async () => {
    render(<SnackbarProvider><App/></SnackbarProvider>)
    expect(screen.getByText("Waiting for input")).toBeInTheDocument();
    expect(screen.getAllByText("Latitude")).toHaveLength(2)
    expect(screen.getAllByText("Longitude")).toHaveLength(2)
})


test("correct country is returned", async () => {
    render(<SnackbarProvider><App/></SnackbarProvider>)

    const latitudeInput = screen.getByTestId("latitude-input")
    const longitudeInput = screen.getByTestId("longitude-input")

    fireEvent.change(latitudeInput, {target: {value: 10}})
    fireEvent.change(longitudeInput, {target: {value: 20}})

    await waitFor(() => expect(screen.getByText("Chad")).toBeInTheDocument())
})

test("'locality' field from geocoding API is respected when the coordinates do not fall onto a country", async () => {
    render(<SnackbarProvider><App/></SnackbarProvider>)

    const latitudeInput = screen.getByTestId("latitude-input")
    const longitudeInput = screen.getByTestId("longitude-input")


    fireEvent.change(latitudeInput, {target: {value: -100}})
    fireEvent.change(longitudeInput, {target: {value: 200}})

    const lat_err_msg = screen.getByText("Should be between -90 and 90")
    const long_err_msg = screen.getByText("Should be between -180 and 180")

    expect(lat_err_msg).not.toBeNull()
    expect(long_err_msg).not.toBeNull()

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

    render(<SnackbarProvider><App/></SnackbarProvider>)

    await waitFor(() => {
        expect(screen.getByText("10.543")).toBeInTheDocument();
        expect(screen.getByText("20.123")).toBeInTheDocument();
    })
})


test("distance to the North Pole is correctly calculated", async () => {
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

    render(<SnackbarProvider><App/></SnackbarProvider>)

    const latitudeInput = screen.getByTestId("latitude-input")
    const longitudeInput = screen.getByTestId("longitude-input")
    const poleDistance = Math.round(getDistanceBetweenTwoPoints({
        lat: 10.543,
        lon: 20.123
    }, {
        lat: 90,
        lon: 135
    }))

    fireEvent.change(latitudeInput, {target: {value: 10}})
    fireEvent.change(longitudeInput, {target: {value: 20}})

    await waitFor(() => {
        expect(screen.getByText(`${poleDistance} km`)).toBeInTheDocument();
    })
})

it("prompts an error when the given latitude and longitude values are out of bounds", async () => {
    render(<SnackbarProvider><App/></SnackbarProvider>)

    const latitudeInput = screen.getByTestId("latitude-input")
    const longitudeInput = screen.getByTestId("longitude-input")

    fireEvent.change(latitudeInput, {target: {value: 100}})
    fireEvent.change(longitudeInput, {target: {value: 181}})

    await waitFor(() => {
        expect(screen.getByText("Should be between -90 and 90")).toBeInTheDocument();
        expect(screen.getByText("Should be between -180 and 180")).toBeInTheDocument();
    })

})

test("check if country changes when new lat and long is entered", async () => {
    render(<SnackbarProvider><App/></SnackbarProvider>)

    const latitudeInput = screen.getByTestId("latitude-input")
    const longitudeInput = screen.getByTestId("longitude-input")

    fireEvent.change(latitudeInput, {target: {value: 38}})
    fireEvent.change(longitudeInput, {target: {value: 35}})


    await waitFor(() => {
        expect(screen.getByText("Turkey")).toBeInTheDocument()
    })

    fireEvent.change(latitudeInput, {target: {value: 10}})
    fireEvent.change(longitudeInput, {target: {value: 20}})

    await waitFor(() => {
        expect(screen.getByTestId("country-locality-p")).toHaveTextContent("Chad")
    })
})


