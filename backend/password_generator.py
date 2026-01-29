#!/usr/bin/env python3
"""
Maximum Complexity Password Generator
Generates cryptographically secure passwords with maximum complexity.
"""

import secrets
import string
import argparse
import sys


class PasswordGenerator:
    """Generate highly complex, cryptographically secure passwords."""
    
    # Character sets for maximum complexity
    LOWERCASE = string.ascii_lowercase
    UPPERCASE = string.ascii_uppercase
    DIGITS = string.digits
    SPECIAL = "!@#$%^&*()_+-=[]{}|;:,.<>?/~`"
    # Extended special characters for even more complexity
    EXTENDED_SPECIAL = "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~"
    
    def __init__(self, use_extended_special=False):
        """
        Initialize the password generator.
        
        Args:
            use_extended_special: If True, uses extended special character set
        """
        self.use_extended_special = use_extended_special
        self.special_chars = self.EXTENDED_SPECIAL if use_extended_special else self.SPECIAL
    
    def generate(self, length=32, min_lowercase=2, min_uppercase=2, 
                 min_digits=2, min_special=2, ensure_all_types=True):
        """
        Generate a password with maximum complexity.
        
        Args:
            length: Total password length (default: 32)
            min_lowercase: Minimum lowercase letters (default: 2)
            min_uppercase: Minimum uppercase letters (default: 2)
            min_digits: Minimum digits (default: 2)
            min_special: Minimum special characters (default: 2)
            ensure_all_types: Ensure all character types are present (default: True)
        
        Returns:
            str: A cryptographically secure password
        """
        if length < (min_lowercase + min_uppercase + min_digits + min_special):
            raise ValueError(
                f"Password length ({length}) must be at least "
                f"{min_lowercase + min_uppercase + min_digits + min_special} "
                f"to satisfy minimum requirements"
            )
        
        # Combine all character sets
        all_chars = self.LOWERCASE + self.UPPERCASE + self.DIGITS + self.special_chars
        
        # Start with required characters to ensure complexity
        password_chars = []
        
        # Add minimum required characters from each type
        password_chars.extend(secrets.choice(self.LOWERCASE) for _ in range(min_lowercase))
        password_chars.extend(secrets.choice(self.UPPERCASE) for _ in range(min_uppercase))
        password_chars.extend(secrets.choice(self.DIGITS) for _ in range(min_digits))
        password_chars.extend(secrets.choice(self.special_chars) for _ in range(min_special))
        
        # Fill the rest with random characters from all sets
        remaining_length = length - len(password_chars)
        password_chars.extend(secrets.choice(all_chars) for _ in range(remaining_length))
        
        # Shuffle to avoid predictable patterns
        # Use secrets.SystemRandom for cryptographically secure shuffling
        rng = secrets.SystemRandom()
        rng.shuffle(password_chars)
        
        password = ''.join(password_chars)
        
        # Final validation: ensure all types are present if required
        if ensure_all_types:
            has_lower = any(c in self.LOWERCASE for c in password)
            has_upper = any(c in self.UPPERCASE for c in password)
            has_digit = any(c in self.DIGITS for c in password)
            has_special = any(c in self.special_chars for c in password)
            
            if not (has_lower and has_upper and has_digit and has_special):
                # Regenerate if validation fails (should be rare)
                return self.generate(length, min_lowercase, min_uppercase, 
                                   min_digits, min_special, ensure_all_types)
        
        return password
    
    def generate_multiple(self, count=1, **kwargs):
        """
        Generate multiple passwords.
        
        Args:
            count: Number of passwords to generate
            **kwargs: Arguments to pass to generate()
        
        Returns:
            list: List of generated passwords
        """
        return [self.generate(**kwargs) for _ in range(count)]
    
    def analyze_complexity(self, password):
        """
        Analyze password complexity and provide statistics.
        
        Args:
            password: Password to analyze
        
        Returns:
            dict: Complexity analysis
        """
        analysis = {
            'length': len(password),
            'lowercase_count': sum(1 for c in password if c in self.LOWERCASE),
            'uppercase_count': sum(1 for c in password if c in self.UPPERCASE),
            'digit_count': sum(1 for c in password if c in self.DIGITS),
            'special_count': sum(1 for c in password if c in self.special_chars),
            'unique_chars': len(set(password)),
            'has_lowercase': any(c in self.LOWERCASE for c in password),
            'has_uppercase': any(c in self.UPPERCASE for c in password),
            'has_digit': any(c in self.DIGITS for c in password),
            'has_special': any(c in self.special_chars for c in password),
        }
        
        # Calculate entropy (approximate)
        char_set_size = 0
        if analysis['has_lowercase']:
            char_set_size += len(self.LOWERCASE)
        if analysis['has_uppercase']:
            char_set_size += len(self.UPPERCASE)
        if analysis['has_digit']:
            char_set_size += len(self.DIGITS)
        if analysis['has_special']:
            char_set_size += len(self.special_chars)
        
        if char_set_size > 0:
            # Entropy = log2(char_set_size^length)
            import math
            analysis['entropy_bits'] = len(password) * math.log2(char_set_size)
        else:
            analysis['entropy_bits'] = 0
        
        return analysis


def main():
    """Command-line interface for the password generator."""
    parser = argparse.ArgumentParser(
        description='Generate cryptographically secure passwords with maximum complexity',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s                    # Generate default 32-character password
  %(prog)s -l 64              # Generate 64-character password
  %(prog)s -l 20 -n 5         # Generate 5 passwords of 20 characters
  %(prog)s -l 16 --extended   # Use extended special character set
  %(prog)s --analyze          # Show complexity analysis
        """
    )
    
    parser.add_argument(
        '-l', '--length',
        type=int,
        default=32,
        help='Password length (default: 32)'
    )
    
    parser.add_argument(
        '--min-lowercase',
        type=int,
        default=2,
        help='Minimum lowercase letters (default: 2)'
    )
    
    parser.add_argument(
        '--min-uppercase',
        type=int,
        default=2,
        help='Minimum uppercase letters (default: 2)'
    )
    
    parser.add_argument(
        '--min-digits',
        type=int,
        default=2,
        help='Minimum digits (default: 2)'
    )
    
    parser.add_argument(
        '--min-special',
        type=int,
        default=2,
        help='Minimum special characters (default: 2)'
    )
    
    parser.add_argument(
        '-n', '--count',
        type=int,
        default=1,
        help='Number of passwords to generate (default: 1)'
    )
    
    parser.add_argument(
        '--extended',
        action='store_true',
        help='Use extended special character set'
    )
    
    parser.add_argument(
        '--analyze',
        action='store_true',
        help='Show complexity analysis for generated password(s)'
    )
    
    parser.add_argument(
        '--no-ensure-types',
        action='store_true',
        help='Do not ensure all character types are present'
    )
    
    args = parser.parse_args()
    
    try:
        generator = PasswordGenerator(use_extended_special=args.extended)
        
        passwords = generator.generate_multiple(
            count=args.count,
            length=args.length,
            min_lowercase=args.min_lowercase,
            min_uppercase=args.min_uppercase,
            min_digits=args.min_digits,
            min_special=args.min_special,
            ensure_all_types=not args.no_ensure_types
        )
        
        for i, password in enumerate(passwords, 1):
            print(password)
            
            if args.analyze:
                analysis = generator.analyze_complexity(password)
                print(f"\n  Complexity Analysis:")
                print(f"  Length: {analysis['length']}")
                print(f"  Lowercase: {analysis['lowercase_count']}")
                print(f"  Uppercase: {analysis['uppercase_count']}")
                print(f"  Digits: {analysis['digit_count']}")
                print(f"  Special: {analysis['special_count']}")
                print(f"  Unique characters: {analysis['unique_chars']}")
                print(f"  Entropy: {analysis['entropy_bits']:.2f} bits")
                if i < len(passwords):
                    print()
    
    except ValueError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
    except KeyboardInterrupt:
        print("\nInterrupted by user", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()

