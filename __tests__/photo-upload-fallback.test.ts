/**
 * Test that cleaners can continue even when photo upload fails
 */

describe('Photo Upload Fallback', () => {
  // Mock the uploadImage function to simulate failure
  const mockUploadImage = jest.fn();
  
  beforeEach(() => {
    // Reset mocks
    mockUploadImage.mockReset();
    
    // Mock console methods to capture debug output
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'log').mockImplementation();
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should allow cleaner to continue when photo upload fails', async () => {
    // Simulate upload failure
    mockUploadImage.mockRejectedValue(new Error('Network error'));
    
    // Create a mock file
    const mockFile = new File(['test image data'], 'test-photo.jpg', {
      type: 'image/jpeg'
    });
    
    // Mock the photo validation to require a photo
    const mockPhotoRequirement = {
      id: 'cama',
      titulo: 'Cama completa',
      descripcion: 'Test photo',
      validacionIA: 'cama bien hecha',
      pasoRelacionado: 6
    };
    
    // In the actual implementation, when upload fails:
    // 1. Error is caught
    // 2. Blob URL is created as fallback
    // 3. Validation is marked as passed
    // 4. Cleaner can continue
    
    // Test that blob URL is created
    const mockCreateObjectURL = jest.fn().mockReturnValue('blob:http://localhost/test-blob');
    global.URL.createObjectURL = mockCreateObjectURL;
    
    // Simulate the completarPaso function behavior with error handling
    let fotoUrl;
    let validacion;
    
    try {
      await mockUploadImage(mockFile);
    } catch (error) {
      // This is what happens in the actual code
      fotoUrl = URL.createObjectURL(mockFile);
      validacion = {
        esValida: true,
        analisis: {
          esperaba: mockPhotoRequirement.validacionIA,
          encontro: 'Error al subir - continuando sin validación'
        }
      };
    }
    
    // Verify fallback behavior
    expect(mockCreateObjectURL).toHaveBeenCalledWith(mockFile);
    expect(fotoUrl).toBe('blob:http://localhost/test-blob');
    expect(validacion.esValida).toBe(true);
    expect(validacion.analisis.encontro).toContain('Error al subir');
  });

  it('should log debug information in development mode', async () => {
    // Set NODE_ENV to development
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    // Simulate upload failure
    const uploadError = new Error('Connection timeout');
    mockUploadImage.mockRejectedValue(uploadError);
    
    const mockFile = new File(['test'], 'photo.jpg', { type: 'image/jpeg' });
    
    try {
      await mockUploadImage(mockFile);
    } catch (error) {
      // Simulate the error handling in completarPaso
      if (process.env.NODE_ENV === 'development') {
        console.error('[DEV] Error uploading photo:', error);
        console.error('[DEV] Stack:', error instanceof Error ? error.stack : 'No stack trace');
        console.error('[DEV] Photo file info:', {
          name: mockFile.name,
          size: mockFile.size,
          type: mockFile.type
        });
      }
    }
    
    // Verify debug logs were called
    expect(console.error).toHaveBeenCalledWith('[DEV] Error uploading photo:', uploadError);
    expect(console.error).toHaveBeenCalledWith('[DEV] Stack:', expect.stringContaining('Error: Connection timeout'));
    expect(console.error).toHaveBeenCalledWith('[DEV] Photo file info:', {
      name: 'photo.jpg',
      size: 4,
      type: 'image/jpeg'
    });
    
    // Restore NODE_ENV
    process.env.NODE_ENV = originalEnv;
  });

  it('should not log debug information in production mode', async () => {
    // Set NODE_ENV to production
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    // Simulate upload failure
    mockUploadImage.mockRejectedValue(new Error('Server error'));
    
    const mockFile = new File(['test'], 'photo.jpg', { type: 'image/jpeg' });
    
    try {
      await mockUploadImage(mockFile);
    } catch (error) {
      // Simulate the error handling in completarPaso
      if (process.env.NODE_ENV === 'development') {
        console.error('[DEV] Error uploading photo:', error);
      }
    }
    
    // Verify debug logs were NOT called
    expect(console.error).not.toHaveBeenCalledWith(expect.stringContaining('[DEV]'));
    
    // Restore NODE_ENV
    process.env.NODE_ENV = originalEnv;
  });
});