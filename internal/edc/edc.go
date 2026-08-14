package edc

import (
	"fmt"
	"slices"

	"pos-simulator-ecr-ws/internal/protocol"
)

// Devices manages paired EDC devices.
type Devices struct {
	protocol *protocol.Client
	posID    string

	devices []Device
}

// New creates a new Devices.
func New(
	protocol *protocol.Client,
	posID string,
) *Devices {
	return &Devices{
		protocol: protocol,
		posID:    posID,
	}
}

// List builds a GET_LIST_EDC request.
func (d *Devices) List() (protocol.Message[ListRequest], error) {
	request := ListRequest{
		POSID: d.posID,
	}

	if err := request.Validate(); err != nil {
		return protocol.Message[ListRequest]{}, err
	}

	return protocol.Build(
		d.protocol,
		protocol.TypeGetListEDC,
		request,
	)
}

// Pair builds a PAIR_POS request.
func (d *Devices) Pair(
	edcID string,
	pairCode string,
) (protocol.Message[PairRequest], error) {
	request := PairRequest{
		EDCID:    edcID,
		PairCode: pairCode,
	}

	if err := request.Validate(); err != nil {
		return protocol.Message[PairRequest]{}, err
	}

	return protocol.Build(
		d.protocol,
		protocol.TypePairPOS,
		request,
	)
}

// Unpair builds an UNPAIR_EDC request.
func (d *Devices) Unpair(
	edcID string,
) (protocol.Message[UnpairRequest], error) {
	request := UnpairRequest{
		EDCID: edcID,
	}

	if err := request.Validate(); err != nil {
		return protocol.Message[UnpairRequest]{}, err
	}

	return protocol.Build(
		d.protocol,
		protocol.TypeUnpairEDC,
		request,
	)
}

// HandleList handles a LIST_EDC response.
func (d *Devices) HandleList(data []byte) error {
	var message protocol.Message[ListResponse]

	if err := protocol.Parse(data, &message); err != nil {
		return err
	}

	d.devices = message.Data.Devices

	return nil
}

// HandlePair handles a PAIR_POS_DONE response.
func (d *Devices) HandlePair(data []byte) error {
	var message protocol.Message[PairResponse]

	if err := protocol.Parse(data, &message); err != nil {
		return err
	}

	device := Device{
		ID: message.Data.EDCID,
	}

	if !slices.Contains(d.devices, device) {
		d.devices = append(d.devices, device)
	}

	return nil
}

// HandleUnpair handles an UNPAIR_EDC_DONE response.
func (d *Devices) HandleUnpair(data []byte) error {
	var message protocol.Message[UnpairResponse]

	if err := protocol.Parse(data, &message); err != nil {
		return err
	}

	if !message.Data.IsSuccessful() {
		return fmt.Errorf("unpair failed: %s", message.Data.Status)
	}

	d.devices = slices.DeleteFunc(d.devices, func(device Device) bool {
		return device.ID == message.Data.EDCID
	})

	return nil
}

// All returns all paired devices.
func (d *Devices) All() []Device {
	return slices.Clone(d.devices)
}

// Reset clears all cached paired devices.
func (d *Devices) Reset() {
	d.devices = nil
}
