package protocol

// Type represents an ECR protocol message type.
type Type string

const (
	// Outbound

	TypeRegisterPOS Type = "REGISTER_POS"
	TypePairPOS     Type = "PAIR_POS"
	TypeUnpairEDC   Type = "UNPAIR_EDC"
	TypeGetListEDC  Type = "GET_LIST_EDC"
	TypeSendToEDC   Type = "SEND_TO_EDC"

	// Inbound

	TypeRegisterPOSDone Type = "REGISTER_POS_DONE"
	TypePairPOSDone     Type = "PAIR_POS_DONE"
	TypeUnpairEDCDone   Type = "UNPAIR_EDC_DONE"
	TypeListEDC         Type = "LIST_EDC"
	TypeSendToPOS       Type = "SEND_TO_POS"
	TypeError           Type = "ERROR"
)
