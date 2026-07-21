export interface CheckoutInfo {
  firstName: string;
  lastName: string;
  postalCode: string;
}

export const validCheckoutInfo: CheckoutInfo = {
  firstName: 'John',
  lastName: 'Doe',
  postalCode: '12345',
};

export const invalidCheckoutCases: { label: string; data: CheckoutInfo; expectedError: string }[] = [
  {
    label: 'missing first name',
    data: { ...validCheckoutInfo, firstName: '' },
    expectedError: 'Error: First Name is required',
  },
  {
    label: 'missing last name',
    data: { ...validCheckoutInfo, lastName: '' },
    expectedError: 'Error: Last Name is required',
  },
  {
    label: 'missing postal code',
    data: { ...validCheckoutInfo, postalCode: '' },
    expectedError: 'Error: Postal Code is required',
  },
  {
    label: 'all fields empty',
    data: { firstName: '', lastName: '', postalCode: '' },
    expectedError: 'Error: First Name is required',
  },
];
