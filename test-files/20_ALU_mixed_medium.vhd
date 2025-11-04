library IEEE;
use IEEE.std_logic_1164.all;
use IEEE.numeric_std.all;

entity alu is 
    port(
        R, S : in unsigned(15 downto 0);
        I : in std_logic_vector(2 downto 0);
        cin, clk, ce : in std_logic;
        cout, sign, zero : out std_logic;
        F : out unsigned(15 downto 0));
end entity;

architecture calculation of alu is 
    signal F_i : unsigned(16 downto 0) := (others => '0');

begin
    sign <= F_i(15);
    zero <= '1' when F_i(15 downto 0) = (15 downto 0 => '0') else '0';
    F <= F_i(15 downto 0);
    cout <= F_i(16);

    process(clk) is
    begin
        if rising_edge(clk) then
            if ce = '1' then
                case I is
                    when "000" =>
                        if cin = '1' then
                            F_i <= ('0' & R) + ('0' & S) + 1;
                        else
                            F_i <= ('0' & R) + ('0' & S) + 0;
                        end if;
                    when "001" =>
                        if cin = '1' then
                            F_i <= ('0' & S) - ('0' & R) - 1;
                        else
                            F_i <= ('0' & S) - ('0' & R);
                        end if;

                    when "010" =>
                        if cin = '1' then
                            F_i <= ('0' & R) - ('0' & S);
                        else
                            F_i <= ('0' & R) - ('0' & S) - 1;
                        end if;
                    when "011" => F_i <= '0' & (R OR S);
                    when "100" => F_i <= '0' & (R AND S);
                    when "101" => F_i <= '0' & (NOT R AND S);
                    when "110" => F_i <= '0' & (R XOR S);
                    when "111" => F_i <= '0' & (R XNOR S);
                    when others => F_i <= (others => '0');
                end case;
            end if;
        end if;
    end process;
end architecture;
