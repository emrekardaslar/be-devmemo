import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { User } from '../entity/User';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// Define repository
const userRepository = AppDataSource.getRepository(User);

// Define JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'super-refresh-secret-key-change-in-production';
const JWT_EXPIRATION = '1h'; // 1 hour
const JWT_REFRESH_EXPIRATION = '7d'; // 7 days

export class AuthController {
  /**
   * Register a new user
   */
  async register(req: Request, res: Response) {
    const { email, firstName, lastName, password } = req.body;
    
    try {
      // Check if user already exists
      const existingUser = await userRepository.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }
      
      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Create verification token (not used now but kept for future implementation)
      const verificationToken = uuidv4();
      
      // Create user - set isVerified to true by default to skip email verification
      const user = userRepository.create({
        email,
        firstName,
        lastName,
        passwordHash,
        verificationToken,
        isVerified: true // Auto-verify users for now
      });
      
      await userRepository.save(user);
      
      // Return success but don't send sensitive information
      return res.status(201).json({ 
        message: 'User registered successfully. You can now login with your credentials.',
        userId: user.id
      });
    } catch (error) {
      console.error('Error registering user:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  /**
   * Login user and return JWT tokens
   */
  async login(req: Request, res: Response) {
    const { email, password, rememberMe = false } = req.body;
    
    try {
      // Find user
      const user = await userRepository.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // We're auto-verifying users, so this check is no longer needed
      // Previously checked if user.isVerified was true
      
      // Generate tokens
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);
      
      // Save refresh token to database
      user.refreshToken = refreshToken;
      await userRepository.save(user);
      
      // Return tokens and user info
      return res.status(200).json({
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: user.roles
        },
        message: 'Login successful'
      });
    } catch (error) {
      console.error('Error logging in:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  /**
   * Refresh access token using refresh token
   */
  async refreshToken(req: Request, res: Response) {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }
    
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as jwt.JwtPayload;
      
      // Find user with matching refresh token
      const user = await userRepository.findOne({ 
        where: { 
          id: decoded.userId,
          refreshToken 
        } 
      });
      
      if (!user) {
        return res.status(401).json({ message: 'Invalid refresh token' });
      }
      
      // Generate new tokens
      const newAccessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);
      
      // Update refresh token in database (token rotation for security)
      user.refreshToken = newRefreshToken;
      await userRepository.save(user);
      
      // Return new tokens
      return res.status(200).json({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      });
    } catch (error) {
      console.error('Error refreshing token:', error);
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
  }
  
  /**
   * Verify user's email
   */
  async verifyEmail(req: Request, res: Response) {
    const { token } = req.params;
    
    try {
      // Find user with this verification token
      const user = await userRepository.findOne({ where: { verificationToken: token } });
      
      if (!user) {
        return res.status(400).json({ message: 'Invalid verification token' });
      }
      
      // Mark user as verified
      user.isVerified = true;
      user.verificationToken = null;
      await userRepository.save(user);
      
      return res.status(200).json({ message: 'Email verified successfully' });
    } catch (error) {
      console.error('Error verifying email:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  /**
   * Request password reset
   */
  async requestPasswordReset(req: Request, res: Response) {
    const { email } = req.body;
    
    try {
      // Find user
      const user = await userRepository.findOne({ where: { email } });
      
      // Don't reveal if user exists or not for security
      if (!user) {
        return res.status(200).json({ 
          message: 'If an account with that email exists, we have sent a password reset link' 
        });
      }
      
      // Generate reset token
      const resetToken = uuidv4();
      
      // Set token expiration (1 hour)
      const resetExpires = new Date();
      resetExpires.setHours(resetExpires.getHours() + 1);
      
      // Save to user
      user.passwordResetToken = resetToken;
      user.passwordResetExpires = resetExpires;
      await userRepository.save(user);
      
      // TODO: Send password reset email
      
      return res.status(200).json({ 
        message: 'If an account with that email exists, we have sent a password reset link' 
      });
    } catch (error) {
      console.error('Error requesting password reset:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  /**
   * Reset password using token
   */
  async resetPassword(req: Request, res: Response) {
    const { token, newPassword } = req.body;
    
    try {
      // Find user with this reset token
      const user = await userRepository.findOne({ 
        where: { 
          passwordResetToken: token,
        } 
      });
      
      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired password reset token' });
      }
      
      // Check if token has expired
      const now = new Date();
      if (!user.passwordResetExpires || user.passwordResetExpires < now) {
        return res.status(400).json({ message: 'Password reset token has expired' });
      }
      
      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 10);
      
      // Update user
      user.passwordHash = passwordHash;
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      await userRepository.save(user);
      
      return res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
      console.error('Error resetting password:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  /**
   * Logout user
   */
  async logout(req: Request, res: Response) {
    const { refreshToken } = req.body;
    
    try {
      if (refreshToken) {
        // Find user with this refresh token
        const user = await userRepository.findOne({ where: { refreshToken } });
        
        if (user) {
          // Clear refresh token
          user.refreshToken = null;
          await userRepository.save(user);
        }
      }
      
      return res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Error logging out:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  /**
   * Get current user profile
   */
  async getProfile(req: Request, res: Response) {
    try {
      // User should be attached by the auth middleware
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const user = await userRepository.findOne({ where: { id: userId } });
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      return res.status(200).json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      });
    } catch (error) {
      console.error('Error getting profile:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
  
  // Helper methods
  private generateAccessToken(user: User): string {
    return jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        roles: user.roles
      }, 
      JWT_SECRET, 
      { expiresIn: JWT_EXPIRATION }
    );
  }
  
  private generateRefreshToken(user: User): string {
    return jwt.sign(
      { userId: user.id }, 
      JWT_REFRESH_SECRET, 
      { expiresIn: JWT_REFRESH_EXPIRATION }
    );
  }
} 